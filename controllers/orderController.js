const { User }= require("../models/signup");
const Category=require("../models/category");
const Product= require("../models/product");
const Cart=require("../models/cart");
const Address=require("../models/address")
const Order=require ("../models/order")
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const axios = require('axios');
const paypal = require('@paypal/checkout-server-sdk');
// Checkout Page
const checkoutPage= async (req, res) => {
    try {
       const  userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
        const product=await Product.find();
        const address=await Address.find({ userId: userId })
        res.render('NewCheck',{
            address,
            cartItems: cart?.cartItems ,
            product
        });
    } catch (e) {
        console.log(e.message);
    }
  }


//   const makeOrder = async (req, res) => {
//     try {
//        const  userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         const { productId ,quatity} = req.body;

//         console.log(req.body)
        
//         const userData = await User.findById(userId)
//         const UserAddress = await Address.findById({ _id: userId})

//         const itemIndex = order.orderItems.findIndex(item => item.productId.toString() === productId);


//         // const products = req.session.product;

        // for (let product of products) {
        //     if (product.inStock <= 0) {
        //         return res.status(403).json({ message: "Product is Out of Stock!!" });
        //   
        // }

//         //  order = new Order({
//         //     userId: userId,
//         //    // orderItems: orderItems,
//         //     address: UserAddress,
//         //     //totalAmount: req.session.totalAmount,
//         // })
//         //await order.save()

//     } catch (e) {
//         console.error('Create Order Failed:', e);
//     }
// };

// const makeOrder = async (req, res) => {
//     try {
//         const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         const { addressId, productId, quantity } = req.body;

//         console.log(req.body);

//         // if (!Array.isArray(productId) || !Array.isArray(quantity) || productId.length !== quantity.length) {
//         //     return res.status(400).json({ message: "Invalid input data" });
//         // }

//         // Construct order items
//         const orderItems = productId.map((id, index) => ({
//             productId: new mongoose.Types.ObjectId(id),
//             quantity: parseInt(quantity[index])
//         }));

//         // Create new order
//         const newOrder = new Order({
//             userId: new mongoose.Types.ObjectId(userId),
//             orderItems: orderItems,
//             address: new mongoose.Types.ObjectId(addressId)
//         });

//         // Save the order to the database
//         await newOrder.save();

//         // Clear the user's cart (assuming user has a cart in their schema)
//         await Cart.updateOne(
//             { userId: userId },
//             { $set: { cartItems: [] } }
//         );

//         //return res.status(201).json({ message: "Order placed successfully", order: newOrder });
//         return res.status(201).redirect('/home',)

//     } catch (e) {
//         console.error("Error placing order:", e.message);
//         //res.status(500).json({ message: "Internal server error" });
//     }
// };

// const makeOrder = async (req, res) => {
//     try {
//         const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         const { addressId,productId, quantity,orderTotal } = req.body;

//         //console.log(req.body);

//         // if (!Array.isArray(productId) || !Array.isArray(quantity) || productId.length !== quantity.length) {
//         //     return res.status(400).json({ message: "Invalid input data" });
//         // }

//         // Construct order items
//         const orderItems = productId.map((id, index) => ({
//             productId: new mongoose.Types.ObjectId(id),
//             quantity: parseInt(quantity[index])
//         }));

//         // Create new order
//         const newOrder = new Order({
//             userId: new mongoose.Types.ObjectId(userId),
//             orderItems,
//             address: new mongoose.Types.ObjectId(addressId),
//             orderTotal,
//         });

//         // Save the order to the database
//         await newOrder.save();

//         // Update stock for each product
//         for (const item of orderItems) {
//             const product = await Product.findById(item.productId);
//             if (!product) {
//                 return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
//             }

//             if (product.stock < item.quantity) {
//                 return res.status(400).json({ message: `Insufficient stock for product ${product.productName}` });
//             }

//             product.stock -= item.quantity;
//             await product.save();
//         }

//         // Clear the user's cart (assuming user has a cart in their schema)
//         await Cart.updateOne(
//             { userId: userId },
//             { $set: { cartItems: [] } }
//         );

//         //return res.status(201).json({ message: "Order placed successfully", order: newOrder });
//         return res.status(201).redirect('/home');

//     } catch (e) {
//         console.error("Error placing order:", e.message);
//        // res.status(500).json({ message: "Internal server error" });
//     }
// };

const makeOrder = async (req, res) => {
    try {
      // Verify user from JWT token
      const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  
      // Destructure request body to get necessary fields
      const { addressId, products, orderTotal, paymentMethod } = req.body;
  
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
        return res.status(402).json({ addressId, products, orderTotal, paymentMethod}); 
      }
  
      // Create new order document
      const newOrder = new Order({
        userId,
        orderItems,
        orderTotal,
        address: addressId,
        paymentMethod:paymentMethod,
        status:"pending"
      });
  
      // Save the order to the database
      await newOrder.save();

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
    // Clear the user's cart 
    //   await Cart.updateOne(
    //     { userId },
    //     { $set: { cartItems: [] } }
    //   );
      await Cart.deleteOne({userId });
  
      // Redirect to home or send a success message
      return res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (e) {
      console.error("Error placing order:", e.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

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
      cancel_url: `${process.env.BASE_URL}/cancelOrder`   // URL if the user cancels payment
    }
  });
  try {
    const order = await client.execute(request);
    return res.json({ id: order.result.id, approval_url: order.result.links.find(link => link.rel === 'approve').href });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error creating PayPal order');
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

    const { products, addressId, orderTotal, paymentMethod } = parsedOrderItems;
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
      address: addressId,
      paymentMethod,
      status:"Order confirmed"
    });

    // Save the order to the database
    await newOrder.save();

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
    await Cart.deleteOne({userId });

    return res.redirect('/orderConfirmation');
  } catch (error) {
    console.error(error.message);
    //res.status(500).send('Error capturing PayPal order');
  }
}

  // const createPayment = async (req, res) => {
  //   const paymentData = {
  //     intent: 'sale',
  //     payer: {
  //       payment_method: 'paypal',
  //     },
  //     transactions: [{
  //       amount: {
  //         total: '10.00',
  //         currency: 'USD',
  //       },
  //       description: 'Your purchase description',
  //     }],
  //     redirect_urls: {
  //       return_url: 'http://127.0.0.1:8004/oredrConfirmation',
  //       cancel_url: 'http://127.0.0.1:8004/payment/cancel',
  //     },
  //   };
  
  //   try {
  //     const response = await axios.post('https://api.sandbox.paypal.com/v1/payments/payment', paymentData, {
  //       auth: {
  //         username: process.env.PAYPAL_CLIENT_ID,
  //         password: process.env.PAYPAL_SECRET,
  //       },
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });
  
  //     const approvalUrl = response.data.links.find(link => link.rel === 'approval_url').href;
  //     res.redirect(approvalUrl);
  //   } catch (error) {
  //     console.error('Error creating PayPal payment:', error);
  //     res.redirect('/payment/error');
  //   }
  // };

const oredrConfirmation= async (req, res) => {
    try {
    //    const  userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    //     const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
    //     const product=await Product.find();
    //     const address=await Address.findOne({ userId: userId })
        res.render('20_oredrConfirmation',{
            // address,
            // cartItems: cart?.cartItems ,
            // product
        });
    } catch (e) {
        console.log(e.message);
    }
  }

  const Confirmation= async (req, res) => {
    try {
    //    const  userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    //     const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
    //     const product=await Product.find();
    //     const address=await Address.findOne({ userid: userId })
        res.render('20_oredrConfirmation',{
            // address,
            // cartItems: cart?.cartItems ,
            // product
        });
    } catch (e) {
        console.log(e.message);
    }
  }

module.exports={
    checkoutPage,
    makeOrder,
    payPalPay,
    captureOrder,
    //createPayment,
    oredrConfirmation,
    Confirmation

}