const User = require('../model/userSchema');
const Category = require('../model/admin/categorySchema');
const Product = require('../model/admin/productSchema');
const Order = require('../model/orderSchema');
const ExcelJS = require('exceljs');
// const productSchema = require('../model/admin/productSchema');

const loadLogin = async(req,res,next)=>{
    try {
        if (req.session.isAdminAuthenticated) {
            // If admin is already authenticated, redirect to the admin dashboard
            res.redirect('/admin/index.html');
        } else {
            // Otherwise, load the login page
            res.render('signin');
        }
       
    } catch (error) {
        console.log(error.message);
        next(error)
    }
}

const verifyLogin = async(req,res)=>{
    try {
        email = process.env.APP_ADMIN_NAME
        password = process.env.APP_ADMIN_PASS
        typedMail = req.body.email
        typedPass = req.body.password
        if(typedMail === email && typedPass === password){

            //res.redirect('/admin/index.html');
            req.session.isAdminAuthenticated = true;
            res.redirect('/admin/index.html')
        }
        else{
            res.render('signin',{message:"Email or password is incorrect"});

            console.log("Invalid input");
        }

    } catch (error) {
        console.log(error.message);
    }
}

const userManage = async (req, res , next) => {
    try {
        const perPage = 10; // Number of users per page
        const page = req.query.page || 1; // Current page number, default to 1

        // Fetch the total count of users
        const totalUsers = await User.countDocuments({});
        
        // Fetch users for the current page
        const usersData = await User.find({})
            .skip((perPage * page) - perPage)
            .limit(perPage);

        res.render('userManagement', {
            users: usersData,
            current: page,
            pages: Math.ceil(totalUsers / perPage),
            totalUsers: totalUsers
        });
    } catch (error) {
        console.log(error.message);
        next(error)
    }
};

// const userManage = async(req,res)=>{
//     try {
//         const usersData = await User.find({});
//         res.render('userManagement',{users:usersData});
//     } catch (error) {
//         console.log(error.message);
//     }
// }


const indexPage = async (req, res, next) => {
    try {
        const userCount = await User.find().count();
        const productCount = await Product.find().count();
        const orderCount = await Order.find().count();
        const result = await Order.aggregate([{ $match: { orderStatus: { $in: ["Completed", "Delivered"] } } }, { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }]);
        const totalSales = result[0] ? result[0].totalSales : 0; // Check if result[0] exists before accessing totalSales

        const topCategories = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topProduct = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.productName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const topBrand = await Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: '$orderItems.brand', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const salesReport = await Order.find({ orderStatus: { $in: ["Completed", "Delivered"] } });

        res.render('index', { userCount, productCount, orderCount, totalSales, salesReport, topCategories, topProduct, topBrand });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

// Controller for fetching sales report
const salesReport = async (req, res, next) => {
    try {
        const { interval, startDate, endDate } = req.query;
        let salesReport;

        if (interval === 'daily') {
            const today = new Date();
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: new Date(today.setHours(0, 0, 0, 0)),
                    $lte: endOfDay
                }
            });
        } else if (interval === 'weekly') {
            const today = new Date();
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const lastDayOfWeek = new Date(firstDayOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: firstDayOfWeek,
                    $lte: lastDayOfWeek
                }
            });
        } else if (interval === 'yearly') {
            const year = new Date().getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: startOfYear,
                    $lte: endOfYear
                }
            });
        } else if (startDate && endDate) {
            salesReport = await Order.find({
                orderStatus: { $in: ["Completed", "Delivered"] },
                orderDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            });
        } else {
            salesReport = await Order.find({ orderStatus: { $in: ["Completed", "Delivered"] } });
        }

        res.json({ salesReport });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};



// Controller for downloading Excel file
const downloadExcel = async (req, res , next) => {
    try {
        const { data } = req.body;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Data');

        // Define the columns for the Excel sheet
        worksheet.columns = [
            { header: 'Order Id', key: 'orderId', width: 20 },
            { header: 'Order Date', key: 'orderDate', width: 20 },
            { header: 'User Name', key: 'userName', width: 20 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 20 },
            { header: 'Offer Discount', key: 'offerDiscount', width: 20 },
            { header: 'Final Price', key: 'finalPrice', width: 20 },
            { header: 'Order Status', key: 'orderStatus', width: 20 },
        ];

        // Add rows to the worksheet
        worksheet.addRows(data);

        // Helper function to sanitize and convert values to numbers
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                // Remove non-numeric characters
                value = value.replace(/[^0-9.-]+/g, '');
            }
            return parseFloat(value) || 0;
        };

        // Calculate the overall totals
        const overallTotal = data.reduce((total, row) => {
            const totalAmount = sanitizeValue(row.totalAmount);
            const couponDiscount = sanitizeValue(row.couponDiscount);
            const offerDiscount = sanitizeValue(row.offerDiscount);
            const finalPrice = sanitizeValue(row.finalPrice);

            total.totalAmount += totalAmount;
            total.couponDiscount += couponDiscount;
            total.offerDiscount += offerDiscount;
            total.finalPrice += finalPrice;

            return total;
        }, { totalAmount: 0, couponDiscount: 0, offerDiscount: 0, finalPrice: 0 });

        // Add the overall total row
        worksheet.addRow({
            orderId: '',
            orderDate: '',
            userName: '',
            productName: 'Overall Total',
            totalAmount: overallTotal.totalAmount.toFixed(2),
            couponDiscount: overallTotal.couponDiscount.toFixed(2),
            offerDiscount: overallTotal.offerDiscount.toFixed(2),
            finalPrice: overallTotal.finalPrice.toFixed(2),
            orderStatus: ''
        });

        // Set response headers and content type for the download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

        // Write the workbook to the response
        await workbook.xlsx.write(res);

        // End the response
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Error generating Excel file');
        next(error)
    }
};



// const indexPage = async(req,res)=>{
//     try {
//         res.render('index');
//     } catch (error) {
//         console.log(error.message);
//     }
// }



const blockAndUnblockUser = async (req, res ,next) => {
    try {
        const id = req.query.id; 
        const userData = await User.findById(id); 

        
        userData.is_verified = !userData.is_verified;
        await userData.save(); 
        
        
        let message = userData.is_verified ? "User blocked successfully" : "User unblocked successfully";
        req.session.isUserAuthenticated = false;

        res.status(200).json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle block status' });
        next(error);
    }
};

const userSearch = async(req,res,next)=>{
    try {
        const perPage = 10; // Number of users per page
        const page = req.query.page || 1; // Current page number, default to 1

        // Fetch the total count of users
        const totalUsers = await User.countDocuments({});
        
        
        let users = [];
        if(req.query.search){

            users = await User.find({ $or: [{ fname: { $regex: req.query.search, $options: 'i' }}, { sname: { $regex: req.query.search, $options: 'i' }}]}).skip((perPage * page) - perPage)
            .limit(perPage);


        }
        else{
            users = await User.find();
        }
         res.render('userManagement',{ users,   current: page,
            pages: Math.ceil(totalUsers / perPage),
            totalUsers: totalUsers });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
}

const adminLogout = (req, res) => {
    
    req.session.destroy()
       
     res.redirect('/admin/signin');
}

const chartFilter = async (req, res, next) => {
    try {
        const { filter, chart } = req.query;
        console.log(`Received filter: ${filter}, chart: ${chart}`);
        
        const currentDate = new Date();
        let startDate;

        // Set date range based on filter
        switch (filter) {
            case 'weekly':
                startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
                break;
            case 'yearly':
                startDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
                break;
            default:
                startDate = new Date(0); // Beginning of time
        }

        console.log(`Start Date: ${startDate}, Current Date: ${currentDate}`);

        let aggregationPipeline;

        if (chart === 'category') {
            aggregationPipeline = [
                { $match: { orderDate: { $gte: startDate, $lte: currentDate } } },
                { $unwind: "$orderItems" },
                { $group: { _id: '$orderItems.category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ];
        } else if (chart === 'product') {
            aggregationPipeline = [
                { $match: { orderDate: { $gte: startDate, $lte: currentDate } } },
                { $unwind: "$orderItems" },
                { $group: { _id: '$orderItems.productName', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ];
        } else {
            return res.status(400).json({ error: 'Invalid chart type' });
        }

        console.log(`Aggregation Pipeline: ${JSON.stringify(aggregationPipeline, null, 2)}`);

        const result = await Order.aggregate(aggregationPipeline);
        console.log(`Aggregation result for ${chart} chart with ${filter} filter:`, result);

        if (result.length === 0) {
            console.warn(`No data found for ${chart} chart with ${filter} filter`);
        }

        const labels = result.map(item => item._id);
        const counts = result.map(item => item.count);

        res.json({ labels, counts });
    } catch (error) {
        console.error('Error in getFilteredChartData:', error);
        res.status(500).json({ error: 'Internal server error' });
        next(error);
    }
};




module.exports = {
    userManage,
    indexPage,
    loadLogin,
    verifyLogin,
    blockAndUnblockUser,
    userSearch,
    adminLogout,
    salesReport,
    downloadExcel,
    chartFilter
}