const { User } = require("../models/signup")
const Product = require("../models/product")
const Category = require("../models/category")
const Cart = require("../models/cart")
const Address = require("../models/address")
const Order = require("../models/order")
const Wallet = require("../models/wallet")

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
      //// console.log(' Account not Found');
      const message = 'Admin Account not Found'
      return res.status(400).json({ message: message })
      //return res.redirect(`/admin/login?error=${encodeURIComponent('Admin Account not Found')}`);
    };

    if (admin.isAdmin === false) {
      //// console.log('You are not na admin');
      const message = "Only Admin have the access"
      return res.status(403).json({ message: message }) // 403 for 
      //return res.redirect(`/admin/login?error=${encodeURIComponent("Only Admin have the access")}`); // 401 for unauthorized
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      //// console.log('Invalid credentials');
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
      { expiresIn: "7d" }
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
    // console.log(e.message);
  }
}

//Admin Logout
const adminLogout = async (req, res) => {
  try {
    res.clearCookie('JWTToken')
    //const message="LOG-OUT SUCCESS !"
    return res.status(200).redirect(`/admin?success=${encodeURIComponent("LOG-OUT SUCCESS !")}`);

  } catch (e) {
    // console.log(e.message);
  }
}

//Load dashBoard
const loadDash = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Find all orders and populate user information
    const order = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(4);
    const totalOrders = await Order.countDocuments();
    const products=await Product.find()
    const category=await Category.find()
    const orders = await Order.find({status: {$in: ["Completed", "Delivered"]}}) //consider completed and Delivered
    const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
    const users=await User.find().sort({ createdAt: -1 }).limit(4);

    const salesEarnings = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
          $facet: {
              daily: [
                  {
                      $group: {
                          _id: {
                              year: { $year: "$createdAt" },
                              month: { $month: "$createdAt" },
                              day: { $dayOfMonth: "$createdAt" }
                          },
                          earnings: { $avg: '$orderTotal' }
                      }
                  },
                  { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
              ],
              weekly: [
                  {
                      $group: {
                          _id: {
                              year: { $year: "$createdAt" },
                              week: { $week: "$createdAt" }
                          },
                          earnings: { $avg: '$orderTotal' }
                      }
                  },
                  { $sort: { "_id.year": 1, "_id.week": 1 } }
              ],
              monthly: [
                  {
                      $group: {
                          _id: {
                              year: { $year: "$createdAt" },
                              month: { $month: "$createdAt" }
                          },
                          earnings: { $avg: '$orderTotal' }
                      }
                  },
                  { $sort: { "_id.year": 1, "_id.month": 1 } }
              ]
          }
      }
  ]);
    const salesAvgEarnings = []
      const earningsData = salesEarnings[0];
      for (let key in earningsData) {
          if (earningsData.hasOwnProperty(key)) {
              const earningsArray = earningsData[key];
              const totalEarnings = earningsArray.reduce((acc, item) => {
                  return acc += item.earnings;
              }, 0);
              const averageEarnings = totalEarnings / earningsArray.length;
              salesAvgEarnings.push({ [key]: averageEarnings.toFixed(1) });
          }
      }
    
// console.log(totalOrders)
    return res.render('2_dashboard',{
      order,
      products,
      category,
      orders,
      totalOrderAmount,
      users,
      salesAvgEarnings
    })
  } catch (e) {
    // console.log(e);
  }
}

const adminDashboard = async (req, res) => {
  try {
      const data = await User.find({})
      const order = await Order.aggregate([
          { $unwind: "$product" },
          { $match: { $nor: [{ "product.productDetails.status": 'cancelled' }, { "product.productDetails.status": 'returned' }] } },
          { $count: "count" }
      ])
      const orderCount = order.length > 0 ? order[0].count : 0;
      const sale = await Order.aggregate([
          { $match: { status: 'delivered' } },
          { $count: 'count' }
      ])
      const salesCount = sale.length > 0 ? sale[0].count : 0;
      const totalProductSales = await Product.aggregate([
          { $match: {} },
          { $group: { _id: null, count: { $sum: "$productSales" } } }
      ])
      const products = await Product.find({})
      const sales = await Order.aggregate([
          { $unwind: '$product' },
          { $match: { "product.productDetails.status": 'delivered' } }])
      const orders = await Order.find({ status: 'delivered' }).sort({ createdAt: -1 })
      const salesEarnings = await Order.aggregate([
          { $match: { status: { $ne: 'cancelled' } } },
          {
              $facet: {
                  daily: [
                      {
                          $group: {
                              _id: {
                                  year: { $year: "$createdAt" },
                                  month: { $month: "$createdAt" },
                                  day: { $dayOfMonth: "$createdAt" }
                              },
                              earnings: { $avg: '$orderTotal' }
                          }
                      },
                      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
                  ],
                  weekly: [
                      {
                          $group: {
                              _id: {
                                  year: { $year: "$createdAt" },
                                  week: { $week: "$createdAt" }
                              },
                              earnings: { $avg: '$orderTotal' }
                          }
                      },
                      { $sort: { "_id.year": 1, "_id.week": 1 } }
                  ],
                  monthly: [
                      {
                          $group: {
                              _id: {
                                  year: { $year: "$createdAt" },
                                  month: { $month: "$createdAt" }
                              },
                              earnings: { $avg: '$orderTotal' }
                          }
                      },
                      { $sort: { "_id.year": 1, "_id.month": 1 } }
                  ]
              }
          }
      ]);
      const salesAvgEarnings = []
      const earningsData = salesEarnings[0];
      for (let key in earningsData) {
          if (earningsData.hasOwnProperty(key)) {
              const earningsArray = earningsData[key];
              const totalEarnings = earningsArray.reduce((acc, item) => {
                  return acc += item.earnings;
              }, 0);
              const averageEarnings = totalEarnings / earningsArray.length;
              salesAvgEarnings.push({ [key]: averageEarnings.toFixed(1) });
          }
      }
      const totalIncome = await Order.aggregate([
          { $unwind: "$product" },
          { $match: { $nor: [{ "product.productDetails.status": 'cancelled' }, { "product.productDetails.status": 'returned' }] } },
          { $group:{_id:null,income:{$sum:'$orderTotal'}}}
      ])
      res.render('dashboard', { data, orderCount, salesCount, sales, orders, totalProductSales, products, salesAvgEarnings,totalIncome })
  } catch (err) {
      // console.log(err);
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
    //// console.log(user);
    return res.render("5_customers",{
        user,
        currentPage: page,
        totalPages,
      });
  } catch (e) {
    // console.log(e.message);
  }
}

// Block and unblock
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
    // console.log(e.message);
  }
};

//Oredr Details
const orderDetails = async (req, res) => {
  const { orderId } = req.params

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
  }
  const ordId = await Order.findById(orderId)
  if (ordId === null) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Order not found ')}`);
  }
  try {
    const order = await Order.findById(orderId).populate('orderItems.productId');
    const userId = order.userId
    const user = await User.findById(userId)
    const addressId = order.address;
    const address = await Address.findById(addressId)
    return res.render("9_orderDetails", {
      orderItems: order?.orderItems,
      order,
      user,
      address
    });
  } catch (e) {
    // console.log(e);
  }
}

//
const deleteOrder = async (req, res) => {
  const { orderId } = req.body

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
  }
  const ordId = await Order.findById(orderId)
  if (ordId === undefined) {
    return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Order not found')}`);
  }
  try {
    await Order.deleteOne({ _id: orderId });
    return res.status(200).json({ message: "Order deleted Successfully" })
  } catch (e) {
    // console.log(e.message);
  }
}

const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;
  // // console.log(req.body)
  try {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
    }
    const ordId = await Order.findById(orderId)
    if (ordId === null) {
      return res.status(404).redirect(`/admin/orderTable?message=${encodeURIComponent('Invalid Order ID')}`);
    }

    await Order.findByIdAndUpdate(orderId, { $set: { status: status } }, { new: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Approve return 
const approveReturn = async (req, res) => {
  const orderId = req.body.orderId;
  // console.log(orderId)

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: 'Invalid Order ID' });
}

const orderData = await Order.findById(orderId);
if (!orderData) {
    return res.status(404).json({ message: 'Order not found' });
}

  try {
      const order = await Order.findByIdAndUpdate(orderId, { $set: { status: 'returned' } }, { new: true });

      // Calculate refund amount by subtracting delivery charge
      const refundAmount = order.orderTotal

      if (refundAmount < 0) {
          return res.status(400).json({ message: "Refund amount cannot be less than zero." });
      }

      // Add to wallet
      const orderData = await Order.findById(orderId);
      await Wallet.findOneAndUpdate(
          { userId: orderData.userId },
          {
              $inc: { walletAmount: refundAmount },
              $push: {
                  transactionHistory: {
                      amount: refundAmount,
                      PaymentType: "Credit",
                      date: new Date()
                  }
              }
          },
          { new: true, upsert: true }
      );

      // Aggregate order data
      const data = await Order.aggregate([
        {
            '$match': {
                '_id': new mongoose.Types.ObjectId(orderId)
            }
        }
    ]);

    if (data.length === 0) {
        throw new Error('Order data aggregation failed.');
    }

    // Update product stock
    for (const product of data[0].orderItems) {
        const update = Number(product.quantity);
        await Product.findOneAndUpdate(
            { _id: product.productId },
            {
                $inc: { stock: update },
                $set: { popularProduct: true }
            }
        );
    }

      return res.status(200).json({ message: "Return approved successfully.", order: order });
  } catch (error) {
      console.error('Error approving return:', error);
      return res.status(500).json({ message: 'An error occurred while approving return.' })
  }
};

const topCategory = async (req, res) => {
  try {
    const topCategory = await Order.aggregate([
      {
        $unwind: "$orderItems" // Unwind order items to deal with each product individually
      },
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "orderItems.productId", // Field from Order schema
          foreignField: "_id", // Field from Product schema
          as: "productDetails" // Name for the resulting array
        }
      },
      {
        $unwind: "$productDetails" // Unwind the product details array
      },
      {
        $group: {
          _id: "$productDetails.category", // Group by category
          totalSales: { $sum: { $multiply: ["$orderItems.quantity", "$productDetails.price"] } }, // Calculate total sales
          count: { $sum: 1 } // Count the number of orders for each category
        }
      },
      {
        $sort: { totalSales: -1 } // Sort by total sales in descending order
      },
      {
        $limit: 10 // Limit to top 10 categories
      }
    ]);

    return res.status(200).json({ topCategory });
  } catch (error) {
    return res.status(500).json({ error: 'Error occurred while fetching top categories' });
  }
};


// const topCategory = async(req,res)=>{
//   try{
//       const topCategory = await Product.aggregate([
//           {
//             $group: {
//               _id: "$category",
//               sales: { $sum: "$productSales" } 
//             }
//           },
//           {
//             $sort: { sales: -1 } 
//           },
//           {
//             $limit: 10 
//           }
//         ]);
//      return res.status(200).json({topCategory})
//   }catch(error){
//       res.status(500).json({error:'Error occured while fetching topCategory'})
//   }
// }.

const topProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      {
        $unwind: "$orderItems" // Unwind order items to deal with each product individually
      },
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "orderItems.productId", // Field from Order schema
          foreignField: "_id", // Field from Product schema
          as: "productDetails" // Name for the resulting array
        }
      },
      {
        $unwind: "$productDetails" // Unwind the product details array
      },
      {
        $group: {
          _id: "$productDetails.productName", // Group by product name
          totalSales: { $sum: { $multiply: ["$orderItems.quantity", "$productDetails.price"] } }, // Calculate total sales
          count: { $sum: 1 } // Count the number of orders for each product
        }
      },
      {
        $sort: { totalSales: -1 } // Sort by total sales in descending order
      },
      {
        $limit: 10 // Limit to top 10 products
      }
    ]);

    // console.log(topProducts, 'topProducts');
    return res.status(200).json({ topProducts });
  } catch (error) {
    return res.status(500).json({ error: 'Error occurred while fetching top products' });
  }
};

// Top  Brand
const topBrands = async (req, res) => {
  try {
    const topBrands = await Order.aggregate([
      {
        $unwind: "$orderItems" // Unwind order items to deal with each product individually
      },
      {
        $lookup: {
          from: "products", // The name of the products collection
          localField: "orderItems.productId", // Field from Order schema
          foreignField: "_id", // Field from Product schema
          as: "productDetails" // Name for the resulting array
        }
      },
      {
        $unwind: "$productDetails" // Unwind the product details array
      },
      {
        $group: {
          _id: "$productDetails.brand", // Group by brand name
          totalSales: { $sum: { $multiply: ["$orderItems.quantity", "$productDetails.price"] } }, // Calculate total sales for each brand
          count: { $sum: 1 } // Count the number of orders for each brand
        }
      },
      {
        $sort: { totalSales: -1 } // Sort by total sales in descending order
      },
      {
        $limit: 10 // Limit to top 10 brands
      }
    ]);
    // console.log(topBrands, 'topBrands');
    return res.status(200).json({ topBrands });
  } catch (error) {
    return res.status(500).json({ error: 'Error occurred while fetching top brands' });
  }
};


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
  updateOrderStatus,
  approveReturn,
  topCategory,
  topProducts,
  topBrands
}