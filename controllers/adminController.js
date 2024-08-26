const { User } = require("../models/signup")
const Product = require("../models/product")
const Cart = require("../models/cart")
const Address = require("../models/address")
const Order = require("../models/order")
const Wallet = require("../models/wallet")

const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
  if (ordId === undefined) {
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
  const orderId = req.body.orderId; // Changed to req.body.orderId to match fetch request payload
  console.log(orderId)

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
                      PaymentType: "credit",
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
      console.error('Error approving return:', error.message);
      return res.status(500).json({ message: 'An error occurred while approving return.' })
  }
};

// Sales Report 
const { startOfWeek, endOfWeek, addWeeks, isValid } = require('date-fns');

const generateSalesReport = async (req, res) => {
  try {
    const { reportType, day, week, month, year, startDate, endDate, page = 1, limit = 10 } = req.query;
    let start, end, reportHeading;

    if (reportType === 'daily') {
      start = new Date(day);
      end = new Date(day);
      end.setHours(23, 59, 59, 999); // End of the day
      reportHeading = `Sales Report of ${new Date(start).toDateString()}`;
    } else if (reportType === 'weekly') {

      if (!week) {
        throw new Error("Week (in 'YYYY-WXX' format) must be provided for weekly reports.");
      }

      // Extract year and week number from the week string (e.g., "2024-W34" -> year: 2024, week: 34)
      const [year, weekNumber] = week.split('-W');

      if (!year || !weekNumber) {
        throw new Error("Invalid 'week' format. It should be in 'YYYY-WXX' format.");
      }

      // Convert the year and week number into start and end dates
      const firstDayOfYear = new Date(`${year}-01-01`);
      const startOfFirstWeek = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
      const startOfGivenWeek = addWeeks(startOfFirstWeek, parseInt(weekNumber, 10) - 1);
      const endOfGivenWeek = endOfWeek(startOfGivenWeek, { weekStartsOn: 1 });

      // Ensure both dates are valid
      if (!isValid(startOfGivenWeek) || !isValid(endOfGivenWeek)) {
        throw new Error("Invalid Date Range for Weekly Report");
      }

      start = startOfGivenWeek;
      end = endOfGivenWeek;
      reportHeading = `Sales Report of Week ${weekNumber}, ${year}`;
    } else if (reportType === 'monthly') {
      start = new Date(`${month}-01`);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // End of the month
      reportHeading = `Sales Report of ${start.toLocaleDateString('default', { month: 'long' })} ${start.getFullYear()}`;
    } else if (reportType === 'yearly') {
      start = new Date(`${year}-01-01`);
      end = new Date(`${year}-12-31`);
      reportHeading = `Sales Report of ${year}`;
    } else if (reportType === 'custom') {
      start = new Date(startDate);
      end = new Date(endDate);
      reportHeading = `Sales Report from ${new Date(start).toDateString()} to ${new Date(end).toDateString()}`;
      end.setHours(23, 59, 59, 999);
    }

    // Fetch orders within the date range
    const orders = await Order.find({
      createdAt: { $gt: start, $lt: end },
      status: { $in: ["Completed", "Delivered"] }  // Only consider completed and Delivered orders
    }).sort({ createdAt: -1 })
      .populate('userId', 'name')
      .populate('orderItems.productId', 'productName discountPrice') // Populating product details


    // Calculate the required statistics
    const totalSales = orders.length;
    const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
    const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);

    // Prepare the data for the report
    const reportData = {
      reportHeading,
      totalSales,
      totalOrderAmount,
      totalDiscount,
      orders
    };

    return res.status(200).json(reportData);
  } catch (error) {
    console.error("Error generating sales report:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




// Sales report function
const generateSale = async (req, res) => {
  try {
    // Get filter parameters from the request (e.g., date range)
    const { startDate, endDate, period } = req.query;

    // Set up date filtering based on period (1 day, week, month) or custom range
    let start, end;
    if (period === 'day') {
      start = moment().startOf('day').toDate();
      end = moment().endOf('day').toDate();
    } else if (period === 'week') {
      start = moment().startOf('week').toDate();
      end = moment().endOf('week').toDate();
    } else if (period === 'month') {
      start = moment().startOf('month').toDate();
      end = moment().endOf('month').toDate();
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default: Last 30 days
      start = moment().subtract(30, 'days').toDate();
      end = moment().toDate();
    }

    // Fetch orders within the date range
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: "completed"  // Only consider completed orders
    })

    // Calculate the required statistics
    const totalSales = orders.length;
    const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
    const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);

    // Prepare the data for the report
    const reportData = {
      totalSales,
      totalOrderAmount,
      totalDiscount,
      orders  // You can format this further as needed
    };

    // Send the report data as JSON (or render a report page)
    res.status(200).json(reportData);

  } catch (error) {
    console.error("Error generating sales report:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const generatePDFReport1 = (reportData) => {
  const doc = new PDFDocument();

  // Set the output file
  doc.pipe(fs.createWriteStream('SalesReport.pdf'));

  // Add report content
  doc.text(`Total Sales: ${reportData.totalSales}`);
  doc.text(`Total Order Amount: ${reportData.totalOrderAmount}`);
  doc.text(`Total Discount: ${reportData.totalDiscount}`);

  // More formatting as needed...

  // Finalize the PDF
  doc.end();
};

// Generate and send the PDF report for download
// const generatePDFReport = async (req, res) => {
//   try {
//     const { reportType, day, week, month, year, startDate, endDate, page = 1, limit = 10 } = req.query;
//     let start, end;

//     // Define start and end dates (same as generateSalesReport function)
//     // ... logic for setting start and end

//     if (reportType === 'daily') {
//       start = new Date(day);
//       end = new Date(day);
//       end.setHours(23, 59, 59, 999); // End of the day
//     } else if (reportType === 'weekly') {
//       // if (!year || !week) {
//       //   throw new Error("Year and week number must be provided for weekly reports.");
//       // }

//       if (!week) {
//         throw new Error("Week (in 'YYYY-WXX' format) must be provided for weekly reports.");
//       }

//       // Extract year and week number from the week string (e.g., "2024-W34" -> year: 2024, week: 34)
//       const [year, weekNumber] = week.split('-W');

//       if (!year || !weekNumber) {
//         throw new Error("Invalid 'week' format. It should be in 'YYYY-WXX' format.");
//       }

//       // Convert the year and week number into start and end dates
//       const firstDayOfYear = new Date(`${year}-01-01`);
//       const startOfFirstWeek = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
//       const startOfGivenWeek = addWeeks(startOfFirstWeek, parseInt(weekNumber, 10) - 1);
//       const endOfGivenWeek = endOfWeek(startOfGivenWeek, { weekStartsOn: 1 });

//       // Ensure both dates are valid
//       if (!isValid(startOfGivenWeek) || !isValid(endOfGivenWeek)) {
//         throw new Error("Invalid Date Range for Weekly Report");
//       }

//       start = startOfGivenWeek;
//       end = endOfGivenWeek;
//     } else if (reportType === 'monthly') {
//       start = new Date(`${month}-01`);
//       end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // End of the month
//     } else if (reportType === 'yearly') {
//       start = new Date(`${year}-01-01`);
//       end = new Date(`${year}-12-31`);
//     } else if (reportType === 'custom') {
//       start = new Date(startDate);
//       end = new Date(endDate);
//     }

//     const orders = await Order.find({
//       createdAt: { $gte: start, $lte: end },
//       status: { $in: ["Completed", "Delivered"] }
//     })
//       .populate('userId', 'name')
//       .populate('orderItems.productId', 'productName discountPrice') // Populating product details
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));

//     // Calculate the required statistics
//     const totalSales = orders.length;
//     const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
//     const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);


//     const reportData = {
//       totalSales,
//       totalOrderAmount,
//       totalDiscount,
//       orders  // You can format this further as needed
//     };

//     // Generate PDF with orders and pagination logic
//     // Use libraries like `pdfkit` or `jsPDF` to generate the PDF
//     const doc = new PDFDocument({ margin: 30 });

//     // Set up the file stream
//     const filePath = path.join(__dirname, 'sales_report.pdf');
//     const stream = fs.createWriteStream(filePath);

//     doc.pipe(stream);

//     // Title
//     doc.fontSize(20).text('Sales Report', { align: 'center' });
//     doc.moveDown(1);

//     // Table Headers
//     doc.fontSize(12).text('Customer Name', { width: 120, continued: true, underline: true });
//     doc.text('Products', { width: 200, continued: true, underline: true });
//     doc.text('Order Total (₹)', { width: 100, align: 'right', underline: true });
//     doc.text('Discount (₹)', { width: 100, align: 'right', underline: true });
//     doc.text('Status', { width: 80, align: 'right', underline: true });

//     doc.moveDown(0.5);

//     // Table Rows
//     reportData.orders.forEach(order => {
//       // Customer Name
//       doc.fontSize(10).text(order.userId.name, { width: 120, continued: true });

//       // Products
//       const productDetails = order.orderItems.map(item => `${item.productId.productName} (x${item.quantity})`).join(', ');
//       doc.text(productDetails, { width: 200, continued: true });

//       // Order Total
//       doc.text(`₹${order.orderTotal.toFixed(2)}`, { width: 100, align: 'right', continued: true });

//       // Discount
//       doc.text(`₹${order.discount.toFixed(2)}`, { width: 100, align: 'right', continued: true });

//       // Status
//       doc.text(order.status, { width: 80, align: 'right' });

//       doc.moveDown(0.5);
//     });

//     // Draw a line to separate the data from the summary
//     doc.moveDown(1).moveTo(30, doc.y).lineTo(570, doc.y).stroke();

//     // Summary Section
//     doc.moveDown(1);
//     doc.fontSize(14).text('Summary', { align: 'center', underline: true });
//     doc.moveDown(1);

//     doc.fontSize(12).text(`Total Sales: ${reportData.totalSales}`, { align: 'left' });
//     doc.text(`Total Order Amount: ₹${reportData.totalOrderAmount.toFixed(2)}`, { align: 'left' });
//     doc.text(`Total Discount: ₹${reportData.totalDiscount.toFixed(2)}`, { align: 'left' });

//     // End the document
//     doc.end();

//     // Send the PDF as a response
//     stream.on('finish', () => {
//       res.download(filePath, 'sales_report.pdf', () => {
//         // Delete the file after download
//         fs.unlinkSync(filePath);
//       });
//     });
//   } catch (error) {
//     console.error('Error generating PDF report:', error);
//     res.status(500).send('Internal Server Error');
//   }
// };

const generatePDFReport = async (req, res) => {
  try {
    const { reportType, day, week, month, year, startDate, endDate, page = 1, limit = 10 } = req.query;
    let start, end;

    // Similar date logic as before for different report types
    if (reportType === 'daily') {
      start = new Date(day);
      end = new Date(day);
      end.setHours(23, 59, 59, 999); // End of the day
    } else if (reportType === 'weekly') {
      // if (!year || !week) {
      //   throw new Error("Year and week number must be provided for weekly reports.");
      // }

      if (!week) {
        throw new Error("Week (in 'YYYY-WXX' format) must be provided for weekly reports.");
      }

      // Extract year and week number from the week string (e.g., "2024-W34" -> year: 2024, week: 34)
      const [year, weekNumber] = week.split('-W');

      if (!year || !weekNumber) {
        throw new Error("Invalid 'week' format. It should be in 'YYYY-WXX' format.");
      }

      // Convert the year and week number into start and end dates
      const firstDayOfYear = new Date(`${year}-01-01`);
      const startOfFirstWeek = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
      const startOfGivenWeek = addWeeks(startOfFirstWeek, parseInt(weekNumber, 10) - 1);
      const endOfGivenWeek = endOfWeek(startOfGivenWeek, { weekStartsOn: 1 });

      // Ensure both dates are valid
      if (!isValid(startOfGivenWeek) || !isValid(endOfGivenWeek)) {
        throw new Error("Invalid Date Range for Weekly Report");
      }

      start = startOfGivenWeek;
      end = endOfGivenWeek;
    } else if (reportType === 'monthly') {
      start = new Date(`${month}-01`);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // End of the month
    } else if (reportType === 'yearly') {
      start = new Date(`${year}-01-01`);
      end = new Date(`${year}-12-31`);
    } else if (reportType === 'custom') {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["Completed", "Delivered"] }
    })
      .populate('userId', 'name')
      .populate('orderItems.productId', 'productName discountPrice') // Populating product details
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Calculate statistics
    const totalSales = orders.length;
    const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
    const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);

    const reportData = {
      totalSales,
      totalOrderAmount,
      totalDiscount,
      orders
    };

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 15 });

    // Set up file stream
    const filePath = path.join(__dirname, 'sales_report.pdf');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Title
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown(1);

    // Define table properties
    const tableTop = doc.y;
    const cellPadding = 10;
    const columnWidths = {
      "": 0,
      customerName: 90,
      products: 80,
      productPrice: 70,
      quantity: 70,
      orderTotal: 80,
      discount: 60,
      status: 100
    };

    // Table Headers with Borders
    doc.fontSize(12);
    doc.text('Customer Name', 30 + cellPadding, tableTop, { width: columnWidths.customerName, continued: true });
    doc.text('Products', 30 + columnWidths.customerName + cellPadding, tableTop, { width: columnWidths.products, continued: true });
    doc.text('Product Price', 30 + columnWidths.customerName + columnWidths.products + cellPadding, tableTop, { width: columnWidths.productPrice, align: 'right', continued: true });
    doc.text('Quantity', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + cellPadding, tableTop, { width: columnWidths.quantity, align: 'right', continued: true });
    doc.text('Order Total (₹)', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + cellPadding, tableTop, { width: columnWidths.orderTotal, align: 'right', continued: true });
    doc.text('Discount (₹)', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + cellPadding, tableTop, { width: columnWidths.discount, align: 'right', continued: true });
    doc.text('Status', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + columnWidths.discount + cellPadding, tableTop, { width: columnWidths.status, align: 'right' });

    // Draw the header border
    const headerHeight = 30;
    doc.rect(30, tableTop - cellPadding, columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + columnWidths.discount + columnWidths.status, headerHeight).stroke();

    let currentY = tableTop + headerHeight;

    // Table Rows with Borders
    reportData.orders.forEach(order => {
      let isFirstProduct = true;

      order.orderItems.forEach(item => {
        doc.fontSize(10);

        // Customer Name
        doc.text(isFirstProduct ? order.userId.name : '', 30 + cellPadding, currentY, { width: columnWidths.customerName, continued: true });

        // Product Name
        doc.text(item.productId ? item.productId.productName : 'Unknown Product', 30 + columnWidths.customerName + cellPadding, currentY, { width: columnWidths.products, continued: true });

        // Product Price
        doc.text(`₹${item.productId ? item.productId.discountPrice.toFixed(2) : 'N/A'}`, 30 + columnWidths.customerName + columnWidths.products + cellPadding, currentY, { width: columnWidths.productPrice, align: 'right', continued: true });

        // Quantity
        doc.text(item.quantity, 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + cellPadding, currentY, { width: columnWidths.quantity, align: 'right', continued: true });

        // Order Total
        doc.text(isFirstProduct ? `₹${order.orderTotal.toFixed(2)}` : '', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + cellPadding, currentY, { width: columnWidths.orderTotal, align: 'right', continued: true });

        // Discount
        doc.text(isFirstProduct ? `₹${order.discount.toFixed(2)}` : '', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + cellPadding, currentY, { width: columnWidths.discount, align: 'right', continued: true });

        // Status
        doc.text(isFirstProduct ? order.status : '', 30 + columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + columnWidths.discount + cellPadding, currentY, { width: columnWidths.status, align: 'right' });

        // Draw a border around the row
        const rowHeight = 20;
        doc.rect(30, currentY - cellPadding, columnWidths.customerName + columnWidths.products + columnWidths.productPrice + columnWidths.quantity + columnWidths.orderTotal + columnWidths.discount + columnWidths.status, rowHeight).stroke();

        currentY += rowHeight;

        isFirstProduct = false;
      });

      currentY += cellPadding; // Add some padding between orders
    });

    // Summary Section
    doc.moveDown(2);
    doc.fontSize(14).text('Summary', { align: 'center', underline: true });
    doc.moveDown(1);

    doc.fontSize(12).text(`Total Sales: ${reportData.totalSales}`, { align: 'left' });
    doc.text(`Total Order Amount (₹): ₹${reportData.totalOrderAmount.toFixed(2)}`, { align: 'left' });
    doc.text(`Total Discount (₹): ₹${reportData.totalDiscount.toFixed(2)}`, { align: 'left' });

    // End the document
    doc.end();

    // Send the PDF as a response
    stream.on('finish', () => {
      res.download(filePath, 'sales_report.pdf', () => {
        // Delete the file after download
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Generate and send the Excel report for download
const generateExcelReport = async (req, res) => {
  try {
    const { reportType, day, week, month, year, startDate, endDate, page = 1, limit = 10 } = req.query;
    let start, end;

    if (reportType === 'daily') {
      start = new Date(day);
      end = new Date(day);
      end.setHours(23, 59, 59, 999); // End of the day
    } else if (reportType === 'weekly') {
      // if (!year || !week) {
      //   throw new Error("Year and week number must be provided for weekly reports.");
      // }

      if (!week) {
        throw new Error("Week (in 'YYYY-WXX' format) must be provided for weekly reports.");
      }

      // Extract year and week number from the week string (e.g., "2024-W34" -> year: 2024, week: 34)
      const [year, weekNumber] = week.split('-W');

      if (!year || !weekNumber) {
        throw new Error("Invalid 'week' format. It should be in 'YYYY-WXX' format.");
      }

      // Convert the year and week number into start and end dates
      const firstDayOfYear = new Date(`${year}-01-01`);
      const startOfFirstWeek = startOfWeek(firstDayOfYear, { weekStartsOn: 1 });
      const startOfGivenWeek = addWeeks(startOfFirstWeek, parseInt(weekNumber, 10) - 1);
      const endOfGivenWeek = endOfWeek(startOfGivenWeek, { weekStartsOn: 1 });

      // Ensure both dates are valid
      if (!isValid(startOfGivenWeek) || !isValid(endOfGivenWeek)) {
        throw new Error("Invalid Date Range for Weekly Report");
      }

      start = startOfGivenWeek;
      end = endOfGivenWeek;
    } else if (reportType === 'monthly') {
      start = new Date(`${month}-01`);
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // End of the month
    } else if (reportType === 'yearly') {
      start = new Date(`${year}-01-01`);
      end = new Date(`${year}-12-31`);
    } else if (reportType === 'custom') {
      start = new Date(startDate);
      end = new Date(endDate);
    }

    // Fetch paginated orders
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["Completed", "Delivered"] }
    })
      .populate('userId', 'name')
      .populate('orderItems.productId', 'productName discountPrice') // Populating product details
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Generate Excel with orders and pagination logic
    // Use libraries like `exceljs` to create Excel files
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');


    // Define the columns for the Excel sheet
    worksheet.columns = [
      { header: 'Order Id', key: 'orderId', width: 20 },
      { header: 'Order Date', key: 'orderDate', width: 10 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Product Price', key: 'productPrice', width: 20 },  // New column for Product Price
      { header: 'Quantity', key: 'productQuantity', width: 10 },  // New column for Product Quantity
      // { header: 'Order', key: 'productTotal', width: 10 },
      { header: 'Discount', key: 'discount', width: 20 },
      { header: 'Total Amount', key: 'orderTotal', width: 20 },
      { header: 'Order Status', key: 'status', width: 20 },
    ];


    // Add rows
    orders.forEach(order => {
      let isFirstProduct = true;  // To track if it's the first product of the order

      order.orderItems.forEach(item => {
        worksheet.addRow({
          customerName: isFirstProduct ? order.userId.name : '',  // Show Customer Name only for the first product row
          orderId: isFirstProduct ? order._id : '',  // Only show Order ID on the first product row
          orderTotal: isFirstProduct ? order.orderTotal : '',  // Only show total on the first product row
          discount: isFirstProduct ? order.discount : '',  // Only show discount on the first product row
          status: isFirstProduct ? order.status : '',  // Only show status on the first product row
          orderDate: isFirstProduct ? order.createdAt : '',  // Only show date on the first product row
          productName: item.productId ? item.productId.productName : 'Unknown Product',  // Show Product Name
          productPrice: item.productId ? item.productId.discountPrice : 'N/A',  // Show Product Price
          productQuantity: item.quantity,// Show Product Quantity,
          // productTotal:item.productId?.discountPrice * item.quantity
        });

        isFirstProduct = false;  // After the first product, set to false
      });
    });



    // Reset the total calculation to avoid counting the same order multiple times
    const totalSales = orders.length;
    const totalOrderAmount = orders.reduce((total, order) => total + order.orderTotal, 0);
    const totalDiscount = orders.reduce((total, order) => total + order.discount, 0);

    // Add the overall total row
    worksheet.addRow({
      orderId: '',
    });

    worksheet.addRow({
      orderId: '',
      userName: '',
      productName: 'Total Sales',
      productPrice: totalSales.toFixed(0),
    });

    worksheet.addRow({
      orderId: '',
      userName: '',
      productName: 'Overall Total',
      productPrice: totalOrderAmount.toFixed(2)
    });

    worksheet.addRow({
      orderId: '',
      userName: '',
      productName: 'Total Discount',
      productPrice: totalDiscount.toFixed(2)
    });

    // Send Excel file as response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send('Internal Server Error');
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
//sales report
  generateSalesReport,
  generatePDFReport,
  generateExcelReport
}