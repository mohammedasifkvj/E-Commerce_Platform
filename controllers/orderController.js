const { User }= require("../models/signup");
const Category=require("../models/category");
const Product= require("../models/product");
const Cart=require("../models/cart");
const Address=require("../models/address")
const Order=require ("../models/order")
const Coupon=require ("../models/coupon")
const Wallet=require ("../models/wallet")

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const axios = require('axios');
const paypal = require('@paypal/checkout-server-sdk');
const PDFDocument = require('pdfkit');

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

    const coupon = await Coupon.find({
      status: true,
      expiredDate: { $gte: currentDate }  // Find coupons where the expiredDate is greater than  the current date
    });
    const wallet=await Wallet.findOne({ userId: userId })
       return res.render('NewCheck',{
            address,
            cartItems: cart?.cartItems,
            coupon,
            wallet
        });
    } catch (e) {
        console.log(e.message);
    }
  }

  const makeOrder = async (req, res) => {
    try {
      const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  
      const { addressId, products, orderTotal, discount, paymentMethod } = req.body;
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
  
      // Declare newOrder outside the block
      let newOrder;
  
      if (paymentMethod === 'Online') {
        return res.status(402).json({ addressId, products, orderTotal, discount, paymentMethod });
      }
  
      if (paymentMethod === 'wallet') {
        // Create new order document for wallet payment
        newOrder = new Order({
          userId,
          orderItems,
          orderTotal,
          discount,
          address: addressId,
          paymentMethod: paymentMethod,
          status: "Order confirmed"
        });
  
        // Update user's wallet balance and log the transaction
        await Wallet.findOneAndUpdate(
          { userId: userId },
          {
            $inc: { walletAmount: -orderTotal },
            $push: {
              transactionHistory: {
                amount: orderTotal,
                PaymentType: 'Debit',
                date: new Date()
              }
            }
          },
          { new: true, upsert: true }
        );
      } else {
        // Create new order document for other payment methods
        newOrder = new Order({
          userId,
          orderItems,
          orderTotal,
          discount,
          address: addressId,
          paymentMethod: paymentMethod,
          status: "pending"
        });
      }
  
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
  
      // Clear the user's cart
      await Cart.deleteOne({ userId });
  
      // Redirect to home or send a success message
      return res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
    } catch (e) {
      console.error("Error placing order:", e.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

// const makeOrder = async (req, res) => {
//     try {
//       const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  
//       const { addressId, products, orderTotal,discount, paymentMethod } = req.body;
//       //console.log(req.body)
  
//       // Validate input data
//       if (!addressId || !products || !products.length) {
//         return res.status(400).json({ message: 'Missing address or product details' });
//       }
  
//       // Create order items from products
//       const orderItems = products.map(item => ({
//         productId: item.productId,
//         quantity: item.quantity
//       }));
      
//       if(paymentMethod=='Online'){
//         return res.status(402).json({ addressId, products, orderTotal,discount, paymentMethod}); 
//       }

//       if(paymentMethod=='wallet'){

//         // Create new order document
//       const newOrder = new Order({
//         userId,
//         orderItems,
//         orderTotal,
//         discount,
//         address: addressId,
//         paymentMethod:paymentMethod,
//         status:"Order Confirmed"
//       });

//       // Update user's wallet balance and log the transaction
//       await Wallet.findOneAndUpdate(
//         { userId: userId },
//         {
//             $inc: { walletAmount: - orderTotal },
//             $push: {
//                 transactionHistory: {
//                     amount: orderTotal,
//                     PaymentType: 'Debit',
//                     date: new Date()
//                 }
//             }
//         },
//         { new: true, upsert: true }
//     );

//       }else{
  
//       // Create new order document
//       const newOrder = new Order({
//         userId,
//         orderItems,
//         orderTotal,
//         discount,
//         address: addressId,
//         paymentMethod:paymentMethod,
//         status:"pending"
//       });
//     }
  
//        // Update stock for each product
//        for (const item of orderItems) {
//         const product = await Product.findById(item.productId);
//         if (!product) {
//             return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
//         }
//         if (product.stock < item.quantity) {
//             return res.status(400).json({ message: `Insufficient stock for product ${product.productName}` });
//         }

//         product.stock -= item.quantity;
//         await product.save();
//     }
    
//     // Save the order to the database
//     await newOrder.save();

//     await Cart.deleteOne({userId});
  
//       // Redirect to home or send a success message
//       return res.status(201).json({ message: "Order placed successfully", orderId: newOrder._id });
//     } catch (e) {
//       console.error("Error placing order:", e.message);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   };

//if payment is online
// PayPal client setup
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

const payPalPay = async (req, res) => {
  const { orderData } = req.body;
  //console.log("this",req.body)
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
    return res.status(500).json({message:'Error creating PayPal order'});
  }
}

const captureOrder = async (req, res) => {
  const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
  const { orderItems,token, PayerID, orderId } = req.query;
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
    // Update the order status based on the simulation result (success or failure)
    const newOrd = await Order.findByIdAndUpdate(orderId, {
      status: 'Order confirmed'
    }, { new: true });

    // Redirect to the order confirmation page
    return res.redirect(`/orderConfirmation/${newOrder._id}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error capturing PayPal order' });
  }
}

// Route to update order status if payment failed
const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Error updating order status' });
  }
};




// Route to capture PayPal order
// const captureOrder = async (req, res) => {
//   const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//   // Extracted order data
//   const { orderItems, token, PayerID } = req.query;
//    //console.log(req.query);

//    const request = new paypal.orders.OrdersCaptureRequest(token);
// // Parse the orderItems JSON string to extract its properties
//    const parsedOrderItems = JSON.parse(orderItems);

//     const { products, addressId, orderTotal,discount, paymentMethod } = parsedOrderItems;
//    // console.log(parsedOrderItems);
  
//   try {
//     const capture = await client.execute(request);
//     // Order captured, redirect to order confirmation
//     const orderItems = products.map(item => ({
//       productId: item.productId,
//       quantity: item.quantity
//     }));

//     // Create new order document
//     const newOrder = new Order({
//       userId,
//       orderItems,
//       orderTotal,
//       discount,
//       address: addressId,
//       paymentMethod,
//       status:"Order confirmed"
//     });

//      // Update stock for each product
//      for (const item of orderItems) {
//       const product = await Product.findById(item.productId);
//       if (!product) {
//           return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
//       }

//       if (product.stock < item.quantity) {
//           return res.status(400).json({ message: `Insufficient stock for product ${product.productName}` });
//       }

//       product.stock -= item.quantity;
//       await product.save();
//   }
//   // Save the order to the database
//     await newOrder.save();

//     await Cart.deleteOne({userId });

//     // Redirect to the order confirmation page with orderId as a URL parameter
//     return res.redirect(`/orderConfirmation/${newOrder._id}`);
//   } catch (error) {
//     console.error(error.message);
//     //return res.status(500).json({message:'Error capturing PayPal order'});
//   }
// }


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
// Inovice
const invoiceDownload = async (req, res) => {
    const { orderId } = req.params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid Order ID' });
    }

    try {
        // Fetch the order and populate the user and address fields
        const order = await Order.findById(orderId)
            .populate('orderItems.productId')
            .populate('userId', 'name email')
            .populate('address')
            .exec();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        const filename = `Invoice-${orderId}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Helper function for drawing lines
        const drawLine = (x1, y1, x2, y2) => {
            doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
        };

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        
        // Company Info
        doc.fontSize(10).font('Helvetica').text('Watch Store', { align: 'right' });
        doc.text('Watch Store, Malappuram, India', { align: 'right' });
        doc.text('Phone: +91 9633079518', { align: 'right' });
        doc.text('Email: watchStore@gmail.com', { align: 'right' });
        
        doc.moveDown(1);
        drawLine(50, doc.y, 550, doc.y);
        doc.moveDown(1);

        // Order Info
        doc.fontSize(10).font('Helvetica').text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'left' });
        doc.text(`Order Status: ${order.status}`, { align: 'left' });
        doc.moveDown(1);

        // Billing Address
        doc.fontSize(12).font('Helvetica-Bold').text('Billing Address', { align: 'left' });
        doc.fontSize(10).font('Helvetica').text(`${order.userId.name}`, { align: 'left' });
        doc.text(`${order.address?.city || ''}, ${order.address?.state || ''} ${order.address?.PIN || ''}`, { align: 'left' });
        doc.text(`Email: ${order.userId.email}`, { align: 'left' });
        doc.text(`Phone: ${order.address?.Mobile || ''}`, { align: 'left' });
        doc.moveDown(1);

        // Order Items Table
        const tableTop = doc.y;
        const itemCodeX = 50;
        const descriptionX = 100;
        const quantityX = 300;
        const priceX = 380;
        const amountX = 480;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', itemCodeX, tableTop);
        doc.text('Description', descriptionX, tableTop);
        doc.text('Qty', quantityX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Amount', amountX, tableTop);

        drawLine(50, doc.y + 5, 550, doc.y + 5);
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica');
        let subtotal = 0;
        order.orderItems.forEach((item, index) => {
            const y = doc.y;
            doc.text(index + 1, itemCodeX, y);
            doc.text(item.productId.productName, descriptionX, y);
            doc.text(item.quantity, quantityX, y);
            doc.text(`₹${item.productId.discountPrice}`, priceX, y);
            const amount = item.quantity * item.productId.discountPrice;
            subtotal += amount;
            doc.text(`₹${amount}`, amountX, y);
            doc.moveDown(0.5);
        });

        drawLine(50, doc.y, 550, doc.y);
        doc.moveDown(0.5);

        // Subtotal, Discount, and Total
        doc.font('Helvetica-Bold');
        const subtotalY = doc.y;
        doc.text('Subtotal:', 350, subtotalY);
        doc.text(`₹${subtotal}`, amountX, subtotalY);
        doc.moveDown(0.5);

        // Calculate and display the actual discount
        const totalBeforeDiscount = subtotal;
        const actualDiscount = totalBeforeDiscount - order.orderTotal;
        const discountY = doc.y;
        doc.text('Discount:', 350, discountY);
        doc.text(`₹${actualDiscount}`, amountX, discountY);
        doc.moveDown(0.5);

        drawLine(350, doc.y, 550, doc.y);
        doc.moveDown(0.5);

        const totalY = doc.y;
        doc.fontSize(12);
        doc.text('Total Amount:', 350, totalY);
        doc.text(`₹${order.orderTotal}`, amountX, totalY);

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text('Thank you for your purchase!', 50, 700, { align: 'center' });

        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching order details');
    }
};


// const invoiceDownload = async (req, res) => {
//   const { orderId } = req.params;

//   if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({ message: 'Invalid Order ID' });
//   }

//   try {
//       // Fetch the order data, including populated product details and address
//       const order = await Order.findById(orderId)
//           .populate('orderItems.productId')
//           .populate('address')
//           .exec();

//       if (!order) {
//           return res.status(404).json({ message: 'Order not found' });
//       }

//       const doc = new PDFDocument({ margin: 50 });
//       const filename = `Invoice-${orderId}.pdf`;

//       res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
//       res.setHeader('Content-type', 'application/pdf');

//       doc.pipe(res);

//       // Helper function to draw lines
//       const drawLine = (x1, y1, x2, y2) => {
//           doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
//       };

//       // Header
//       doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
//       doc.moveDown(0.5);

//       // Company Info
//       doc.fontSize(10).font('Helvetica').text('Watch Store', { align: 'right' });
//       doc.text('Watch Store, Malappuram, India', { align: 'right' });
//       doc.text('Phone: +91 9633079518', { align: 'right' });
//       doc.text('Email: watchStore@gmail.com', { align: 'right' });

//       doc.moveDown(1);
//       drawLine(50, doc.y, 550, doc.y);
//       doc.moveDown(1);

//       // Order Info
//       doc.fontSize(10).font('Helvetica').text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'left' });
//       doc.text(`Order Status: ${order.status}`, { align: 'left' });
//       doc.moveDown(1);

//       // Billing Address
//       doc.fontSize(12).font('Helvetica-Bold').text('Billing Address', { align: 'left' });
//       const address = order.address;
//       doc.fontSize(10).font('Helvetica').text(`${address.name}`, { align: 'left' });
//       doc.text(`${address.address}`, { align: 'left' });
//       doc.text(`${address.city}, ${address.state} ${address.PIN}`, { align: 'left' });
//       doc.text(`Email: ${address.email}`, { align: 'left' });
//       doc.text(`Phone: ${address.mobile}`, { align: 'left' });
//       doc.moveDown(1);

//       // Order Items Table Header
//       const tableTop = doc.y;
//       const itemCodeX = 50;
//       const descriptionX = 100;
//       const quantityX = 300;
//       const priceX = 380;
//       const amountX = 480;

//       doc.fontSize(10).font('Helvetica-Bold');
//       doc.text('Item', itemCodeX, tableTop);
//       doc.text('Description', descriptionX, tableTop);
//       doc.text('Qty', quantityX, tableTop);
//       doc.text('Price', priceX, tableTop);
//       doc.text('Amount', amountX, tableTop);

//       drawLine(50, doc.y + 5, 550, doc.y + 5);
//       doc.moveDown(0.5);

//       // Table rows for each product in the order
//       doc.font('Helvetica');
//       let subtotal = 0;
//       order.orderItems.forEach((item, index) => {
//           const product = item.productId;
//           const y = doc.y;

//           // Display product details in the table
//           doc.text(index + 1, itemCodeX, y);
//           doc.text(product.productName, descriptionX, y);
//           doc.text(item.quantity, quantityX, y);
//           doc.text(`₹${product.discountPrice}`, priceX, y);
//           const amount = item.quantity * product.discountPrice;
//           subtotal += amount;
//           doc.text(`₹${amount}`, amountX, y);
//           doc.moveDown(0.5);
//       });

//       drawLine(50, doc.y, 550, doc.y);
//       doc.moveDown(0.5);

//       // Subtotal, Delivery Charge, Discount, and Total
//       doc.font('Helvetica-Bold');
//       const subtotalY = doc.y;
//       doc.text('Subtotal:', 350, subtotalY);
//       doc.text(`₹${subtotal}`, amountX, subtotalY);
//       doc.moveDown(0.5);

//       // Delivery Charge
//       const deliveryCharge = 60; // Fixed delivery charge
//       const deliveryChargeY = doc.y;
//       doc.text('Delivery Charge:', 350, deliveryChargeY);
//       doc.text(`₹${deliveryCharge}`, amountX, deliveryChargeY);
//       doc.moveDown(0.5);

//       // Discount
//       const totalBeforeDiscount = subtotal + deliveryCharge;
//       const actualDiscount = totalBeforeDiscount - order.orderTotal;
//       const discountY = doc.y;
//       doc.text('Discount:', 350, discountY);
//       doc.text(`₹${actualDiscount}`, amountX, discountY);
//       doc.moveDown(0.5);

//       drawLine(350, doc.y, 550, doc.y);
//       doc.moveDown(0.5);

//       // Total Amount
//       const totalY = doc.y;
//       doc.fontSize(12);
//       doc.text('Total Amount:', 350, totalY);
//       doc.text(`₹${order.orderTotal}`, amountX, totalY);

//       // Footer
//       doc.fontSize(10).font('Helvetica');
//       doc.text('Thank you for your business!', 50, 700, { align: 'center' });

//       doc.end();

//   } catch (error) {
//       console.error('Error fetching order details:', error);
//       res.status(500).send('Error fetching order details');
//   }
// };


module.exports={
    stockCheck,
    checkoutPage,
    makeOrder,
    payPalPay,
    captureOrder,
    updateOrderStatus,
    //createPayment,
    oredrConfirmation,
    invoiceDownload
}