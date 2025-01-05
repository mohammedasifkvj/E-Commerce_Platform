const { User } = require('../models/signup');
const Product = require('../models/product');
const Category = require('../models/category')
const Address = require('../models/address')
const Wishlist = require("../models/wishList")
const Order = require("../models/order")
const Wallet = require("../models/wallet")

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs');

// Account Home Page
const profile = async (req, res) => {
    const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    try {
        const userData = await User.findById({ _id: userId })
        return res.render('15_account', { userData });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

const profileSettings = async (req, res) => {
    try {
        return res.render('19_accountSetting');
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

const changePassword = async (req, res) => {
    // const userId = req.user.id;
    const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    const { newPassword, confirmPassword } = req.body;

    try {
        // Check if both passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Validate password criteria (8 characters, uppercase, lowercase, number, special character)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])(?!.*\s).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, a special character, and no spaces.' });
        }
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ message: 'An error occurred while changing the password' });
    }
};

// Address Page
const address = async (req, res) => {
    const userId = req.user.id;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // Number of addresses per page
        const skip = (page - 1) * limit;

        // Fetch the total number of addresses for this user
        const totalAddresses = await Address.countDocuments({ userId: userId });

        const totalPages = Math.ceil(totalAddresses / limit);

        const address = await Address.find({ userId: userId })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const userData = await User.findById({ _id: userId });

        return res.render('16_address', {
            userData,
            address,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
};

//Add address Page
const addAddressPage = async (req, res) => {
    try {
        return res.render('16_addAddress');
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

//Add address
const addAddress = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId)
        const email = user.email

        const userAddress = new Address(req.body)
        userAddress.userId = userId
        userAddress.email = email

        await userAddress.save()
        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

// Edit Address Page Load
const editAddressPage = async (req, res) => {
    const addressId = req.query.id
    //Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User')
    }
    const address = await Address.findById(addressId)
    if (address == undefined) {
        return res.status(404).render('404User')
    }
    try {
        return res.render('16_editAddress', { address });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

// Update Address
const editAddress = async (req, res) => {
    const { addressId } = req.params;
    // Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User')
    }
    const address = await Address.findById(addressId)
    if (address === undefined) {
        return res.status(404).render('404User')
    }
    try {
        await Address.updateOne({ _id: addressId }, { $set: req.body });
        const message = "Address updated successfully!";
        return res.status(200).json({ success: true, message: message })
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

// Delete Address
const deleteAddress = async (req, res) => {
    const { addressId } = req.body;
    // Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User');
    }
    const address = await Address.findById(addressId)
    if (address === undefined) {
        return res.status(404).render('404User')
    }
    try {
        await Address.deleteOne({ _id: addressId });
        const message = 'Address deleted Successfully';
        return res.status(200).json({ message: message });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
};

// Show Oreders
const orders = async (req, res) => {
    const userId = req.user.id;

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const totalOrders = await Order.countDocuments({ userId: userId });

        const totalPages = Math.ceil(totalOrders / limit);

        const order = await Order.find({ userId: userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip) // Skip the orders of previous pages
            .limit(limit)
            .populate('orderItems.productId')
            .populate('address');

        return res.render('17_orders', {
            order,
            currentPage: page,
            totalPages,
            limit
        });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
};


// Oreder  Details
const orderDetails = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(404).redirect('/orders')
    }
    const orders = await Order.findById(orderId)
    if (orders == undefined) {
        return res.status(404).redirect('/orders')
    }

    try {
        const order = await Order.findById({ _id: orderId }).populate('orderItems.productId');
        const user = await User.findById(userId)
        const addressId = order.address;
        const address = await Address.findById(addressId)
        return res.render('17_orderDetails', {
            orderItems: order?.orderItems,
            order,
            user,
            address
        });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}
// Show Wish List 
const wishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const page = parseInt(req.query.page) || 1; // Current page, default to 1
        const limit = 8; // Number of wishlist items per page
        const skip = (page - 1) * limit;

        // Get the total number of wishlist items for this user
        const totalWishlistItems = await Wishlist.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $project: { totalItems: { $size: "$wishlistItems" } } }
        ]);

        const totalItems = totalWishlistItems.length > 0 ? totalWishlistItems[0].totalItems : 0;
        const totalPages = Math.ceil(totalItems / limit);

        // Fetch wishlist for this user with pagination
        const wishlist = await Wishlist.findOne({ userId: userId })
            .populate('wishlistItems.productId')
            .slice('wishlistItems', [skip, limit])
            .sort({ createdAt: -1 });

        const products = await Product.find({ isDeleted: false });

        // If the wishlist is not found or empty, render the page with an empty list
        if (!wishlist || wishlist.wishlistItems.length === 0) {
            return res.render('18_wishList', {
                currentPage: page,
                totalPages,
                wishlistItems: [],
                product: products
            });
        }

        // Render the wishlist page with fetched items
        return res.render('18_wishList', {
            currentPage: page,
            totalPages,
            wishlistItems: wishlist.wishlistItems,
            product: products
        });
    } catch (e) {
        return res.status(500).json({ message: 'An error occurred' });
    }
};


const requestForReturn = async (req, res) => {
    const { orderId, reason } = req.body;
    //console.log(req.body)
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: 'Invalid Order ID' });
    }

    const orderData = await Order.findById(orderId);
    if (!orderData) {
        return res.status(404).json({ message: 'Order not found' });
    }

    try {
        const order = await Order.findByIdAndUpdate(orderId,
            { $set: { returnReason: reason, status: 'Requested for Return' } })

        return res.status(200).json({
            message: "Return processed successfully.",
            order: order
        });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
}

// cancelOrder
const cancellOrder = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        //console.log(orderId)
        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid Order ID' });
        }

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status to 'cancelled'
        await Order.findByIdAndUpdate(orderId, { $set: { status: "cancelled" } }, { new: true });

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

        // Refund amount to wallet if payment method is online or wallet
        if (orderData.paymentMethod === 'Online' || orderData.paymentMethod === 'wallet') {
            const userId = orderData.userId;
            const orderAmount = orderData.orderTotal;

            // Update user's wallet balance and log the transaction
            await Wallet.findOneAndUpdate(
                { userId: userId },
                {
                    $inc: { walletAmount: orderAmount },
                    $push: {
                        transactionHistory: {
                            amount: orderAmount,
                            PaymentType: 'credit',
                            date: new Date()
                        }
                    }
                },
                { new: true, upsert: true }
            );
        }

        return res.status(200).json({ message: 'Order Cancelled Successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'An error occurred while Cancelling Order' });
    }
};

// wallet Page
const wallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentPage = parseInt(req.query.page) || 1;
        const dataPerPage = 8;
        const skip = (currentPage - 1) * dataPerPage;

        // Fetch the wallet details for the user
        const wallet = await Wallet.findOne({ userId: userId });

        if (!wallet) {
            return res.render('19_ wallet', {
                wallet,
                walletAmount: 0,
                transactionHistory: [],
                currentPage,
                totalPages: 0
            });
        }

        // Get the total number of transactions
        const totalTransactions = wallet.transactionHistory.length;
        const totalPages = Math.ceil(totalTransactions / dataPerPage);

        // Paginate the transactionHistory
        const paginatedTransactions = wallet.transactionHistory
            .sort((a, b) => b.date - a.date) // Sort by date, most recent first
            .slice(skip, skip + dataPerPage); // Apply pagination (skip and limit)

        return res.render('19_ wallet', {
            wallet,
            walletAmount: wallet.walletAmount.toFixed(2),
            transactionHistory: paginatedTransactions,
            currentPage,
            totalPages,
        });
    } catch (e) {
        return res.status(500).json({message:e.message});
    }
};

module.exports = {
    profile,
    profileSettings,
    changePassword,
    address,
    addAddressPage,
    addAddress,
    editAddressPage,
    editAddress,
    deleteAddress,
    orders,
    orderDetails,
    requestForReturn,
    cancellOrder,
    wishlist,
    wallet
}