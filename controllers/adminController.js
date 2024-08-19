const { User } = require("../models/signup")
const Product = require("../models/product")
const Cart = require("../models/cart")
const Address = require("../models/address")
const Order = require("../models/order")

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')

//the name in views for render
//Load Sign in
const loadAdminSignIn = (req, res) => {
  const { message, success } = req.query
  res.render('1_login', {
    message,
    success
  });
}

// Admin Sign-In
const adminSignIn = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!(email && password)) {
      return res.redirect(`/admin/login?error=${encodeURIComponent('Enter all Fields')}`);
    }
    //query from DB
    const admin = await User.findOne({ email })

    if (!admin) {
      //console.log(' Account not Found');
      const message = 'Admin Account not Found'
      return res.status(400).json({ message: message })
      //return res.redirect(`/admin/login?error=${encodeURIComponent('Admin Account not Found')}`);
    };

    if (admin.isAdmin === false) {
      //console.log('You are not na admin');
      const message = "Only Admin have the access"
      return res.status(403).json({ message: message }) // 403 for 
      //return res.redirect(`/admin/login?error=${encodeURIComponent("Only Admin have the access")}`); // 401 for unauthorized
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      //console.log('Invalid credentials');
      const message = 'Password is Incorrect'
      return res.status(401).json({ message: message }) // 401 for unauthorized
      //return res.redirect(`/admin/login?error=${encodeURIComponent("Email or password is incorrect")}`); // 401 for unauthorized
    }

    const accessToken = jwt.sign(
      { id: admin._id, role: "admin" },   //
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id, role: "admin" },   //
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "2m" }
    );

    admin.token = accessToken;
    admin.password = undefined

    const options = {
      //expires:new Date(Date.now()+7*24*60*60*1000)   // 7day expiry
      httpOnly: true, // cookies can manipulate by browser only
      secure: true
    }
    // send token in admin cookie
    res.cookie('JWTToken', accessToken, options)
    return res.redirect('/admin/dash')
  } catch (e) {
    console.log(e.message);
  }
}

//Load dashBoard
const loadDash = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of product per page
    const skip = (page - 1) * limit;
    // Find all orders and populate user information
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    return res.render('2_dashboard', {
      orders,
      currentPage: page,
      totalPages,
    })
  } catch (e) {
    console.log(e.message);
  }
}

//  Load Customer details Table
const customerTable = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of offers per page
    const skip = (page - 1) * limit;

    const user = await User.find({ isAdmin: false }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    //console.log(user);
    return res.render("5_customers",
      {
        user,
        currentPage: page,
        totalPages,
      });
  } catch (e) {
    console.log(e.message);
  }
}

const blockAndUnblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: 'user not found' });
    }

    if (userData.isBlocked) {
      await User.findByIdAndUpdate(userId, { $set: { isBlocked: false } }, { new: true });
      return res.json({ success: true, message: 'user unblocked successfully' });
    } else {
      await User.findByIdAndUpdate(userId, { $set: { isBlocked: true } }, { new: true });
      // clear the user cookies
      res.clearCookie('jwtToken')
      return res.json({ success: true, message: 'user blocked successfully' });
    }

  } catch (e) {
    res.json({ success: false, message: 'An error occurred' });
  }
};

//Order Table
const orderTable = async (req, res) => {
  const { message, success } = req.query
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of Orderes per page
    const skip = (page - 1) * limit;
    // Find all orders and populate user information
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    return res.render('9_orders', {
      orders,
      currentPage: page,
      totalPages,
      message,
      success
    });
  } catch (e) {
    console.log(e.message);
  }
};

//Oredr Details
const orderDetails = async (req, res) => {
  const { orderId } = req.params
  
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
  }
  const ordId = await Order.findById(orderId)
  if (ordId === null ) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Order not found ')}`);
  }
  try {
    const order = await Order.findById(orderId).populate('orderItems.productId');
    const userId = order.userId
    const user = await User.findById(userId)
    const addressId=order.address;
    const address = await Address.findById(addressId)
    return res.render("9_orderDetails", {
      orderItems: order?.orderItems,
      order,
      user,
      address
    });
  } catch (e) {
    console.log(e);
  }
}

//
const deleteOrder = async (req, res) => {
  const { orderId } = req.body

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
  }
  const ordId = await Order.findById(orderId)
  if (ordId === undefined ) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Order not found')}`);
  }
  try {
    await Order.deleteOne({ _id: orderId });
    return res.status(200).json({ message: "Order deleted Successfully" })
  } catch (e) {
    console.log(e.message);
  }
}

const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  // console.log(req.body)
  try {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
    }
    const ordId = await Order.findById(orderId)
    if (ordId === null ) {
      return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
    }

    await Order.findByIdAndUpdate(orderId, { $set: { status: status } }, { new: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//Admin Logout
const adminLogout = async (req, res) => {
  try {
    res.clearCookie('JWTToken')
    //const message="LOG-OUT SUCCESS !"
    return res.status(200).redirect(`/admin?success=${encodeURIComponent("LOG-OUT SUCCESS !")}`);

  } catch (e) {
    console.log(e.message);
  }
}

module.exports = {
  //Sign In
  loadAdminSignIn,
  adminSignIn,
  adminLogout,
  loadDash,
  //Customer Managemnet
  customerTable,
  blockAndUnblockUser,
  //Order Management
  orderTable,
  orderDetails,
  deleteOrder,
  updateOrderStatus
}