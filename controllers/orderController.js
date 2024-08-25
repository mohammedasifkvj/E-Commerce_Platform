const { User }= require("../models/signup");
const Category=require("../models/category");
const Product= require("../models/product");
const Cart=require("../models/cart");
const Address=require("../models/address")
const Order=require ("../models/order")
const Coupon=require ("../models/coupon")
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const axios = require('axios');
const paypal = require('@paypal/checkout-server-sdk');

//Stock check before move to  Checkout Page
const stockCheck=async (req, res) => {
  const { cartItems } = req.body;  
  try {
    
    const outOfStockProducts = [];

    // Check if enough stock is available for each product in the cart
    for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
            outOfStockProducts.push({
                productName: product ? product.productName : 'Unknown Product',
                available: product ? product.stock : 0,
                inCart: item.quantity
            });
        }
    }

    if (outOfStockProducts.length > 0) {
        return res.json({ success: false, outOfStockProducts });
    }

    // If all items have sufficient stock
    return res.json({ success: true });
} catch (error) {
    console.error('Error checking stock:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
}
};

// Checkout Page
const checkoutPage= async (req, res) => {
  const userId = req.user.id;
    try {
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
        const address=await Address.find({ userId: userId })
        const currentDate = new Date();

    // Find active coupons that have not expired
    const coupon = await Coupon.find({
      status: true,
      expiredDate: { $gte: currentDate }  // Find coupons where the expiredDate is greater than  the current date
    });
       return res.render('NewCheck',{
            address,
            cartItems: cart?.cartItems,
            coupon
        });
    } catch (e) {
        console.log(e.message);
    }
  }


const makeOrder = async (req, res) => {
    try {
      // Verify user from JWT token
      const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  
      // Destructure request body to get necessary fields
      const { addressId, products, orderTotal,discount, paymentMethod } = req.body;
      //console.log(req.body)
  
      // Validate input data
      if (!addressId || !products || !products.length) {
        return res.status(400).json({ message: 'Missing address or product details' });
      }
  
      // Create order items from products
      const orderItems = products.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      if(paymentMethod=='Online'){
        return res.status(402).json({ addressId, products, orderTotal,discount, paymentMethod}); 
      }
  
      // Create new order document
      const newOrder = new Order({
        userId,
        orderItems,
        orderTotal,
        discount,
        address: addressId,
        paymentMethod:paymentMethod,
        status:"pending"
      });
  
       // Update stock for each product
       for (const item of orderItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
            return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({ message: `Insufficient stock for product ${product.productName}` });
        }

        product.stock -= item.quantity;
        await product.save();
    }
    
    // Save the order to the database
    await newOrder.save();

    await Cart.deleteOne({userId });
  
      // Redirect to home or send a success message
      return res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
    } catch (e) {
      console.error("Error placing order:", e.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
//if payment is online
 // PayPal client setup
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

const payPalPay = async (req, res) => {
  const { orderData } = req.body;
  console.log("this",req.body)
  const request = new paypal.orders.OrdersCreateRequest();
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: orderData.orderTotal
      }
    }],
    application_context: {
      return_url: `${process.env.BASE_URL}/captureOrder?orderItems=${encodeURIComponent(JSON.stringify(orderData))}`, // URL to capture order
      cancel_url: `${process.env.BASE_URL}/checkout`   // URL if the user cancels payment
    }
  });
  try {
    const order = await client.execute(request);
    return res.json({ id: order.result.id, approval_url: order.result.links.find(link => link.rel === 'approve').href });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({message:'Error creating PayPal order'});
  }
}

// Route to capture PayPal order
const captureOrder = async (req, res) => {
  //const { } = req.query; // Token from PayPal URL
  // Extracted order data
  // const { addressId, products, orderTotal, paymentMethod,token} = req.query;
  // 
  const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  const { orderItems, token, PayerID } = req.query;
   //console.log(req.query);

   const request = new paypal.orders.OrdersCaptureRequest(token);
// Parse the orderItems JSON string to extract its properties
   const parsedOrderItems = JSON.parse(orderItems);

    const { products, addressId, orderTotal,discount, paymentMethod } = parsedOrderItems;
   // console.log(parsedOrderItems);
  
  try {
    const capture = await client.execute(request);
    // Order captured, redirect to order confirmation
    const orderItems = products.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    // Create new order document
    const newOrder = new Order({
      userId,
      orderItems,
      orderTotal,
      discount,
      address: addressId,
      paymentMethod,
      status:"Order confirmed"
    });

    
     // Update stock for each product
     for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product ${product.productName}` });
      }

      product.stock -= item.quantity;
      await product.save();
  }
  // Save the order to the database
    await newOrder.save();

    await Cart.deleteOne({userId });

    // Redirect to the order confirmation page with orderId as a URL parameter
    return res.redirect(`/orderConfirmation/${newOrder._id}`);
  } catch (error) {
    console.error(error.message);
    //return res.status(500).json({message:'Error capturing PayPal order'});
  }
}


const oredrConfirmation= async (req, res) => {
  const  userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  const orderId = req.params.orderId;

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).redirect('/orders')
  }
  const ord = await Order.findById(orderId)
  if (ord == undefined) {
      return res.status(404).redirect('/orders')
  }
  try {
    const order = await Order.findById(orderId).populate('orderItems.productId');
    const user = await User.findById(userId)
    const addressId=order.address;
    const address = await Address.findById(addressId)
    return res.render('20_oredrConfirmation',{
        orderItems: order?.orderItems,
        order,
        user,
        address
        });
    } catch (e) {
        console.log(e.message);
    }
  }

module.exports={
    stockCheck,
    checkoutPage,
    makeOrder,
    payPalPay,
    captureOrder,
    //createPayment,
    oredrConfirmation
}