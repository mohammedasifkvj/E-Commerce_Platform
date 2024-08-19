const { User } = require('../models/signup');
const Product = require('../models/product');
const Category = require('../models/category')
const Address = require('../models/address')
const Wishlist = require("../models/wishList")
const Order = require("../models/order")
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')

//const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id; 

// Account Home Page
const profile = async (req, res) => {
    const userId = req.user.id;
    try {
        const userData = await User.findById({ _id: userId })
        res.render('15_account', { userData });
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}
// Address Page
const address = async (req, res) => {
    const userId = req.user.id;
    try {
        const userData = await User.findById({ _id: userId })
        const address = await Address.find({ userId: userId })
        return res.render('16_address', { userData, address });
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

//Add address Page
const addAddressPage = async (req, res) => {
    try {
        return res.render('16_addAddress');
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

//Add address
const addAddress = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId)
        const email = user.email

        // if (!req.body.is_Home && !req.body.is_Work) {
        //     return res.status(403).json({ message: "please select address type" })
        // }
        const userAddress = new Address(req.body)
        userAddress.userId = userId
        userAddress.email = email

        await userAddress.save()
        return res.status(200).json({ success: true });
    } catch (e) {
        console.log(e.message);
    }
}

// Edit Address Page Load
const editAddressPage = async (req, res) => {
    const addressId = req.query.id
    //Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User')
    }
    const addId = await Address.findById(addressId)
    if (addId == undefined) {
        return res.status(404).render('404User')
    }
    try {
        const address = await Address.findById(addressId)
        return res.render('16_editAddress', { address });
    } catch (e) {
        console.log(e.message);
    }
}

// Update Address
const editAddress = async (req, res) => {
    const { addressId } = req.params;
    // Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User')
    }
    const addId = await Address.findById(addressId)
    if (addId == undefined) {
        return res.status(404).render('404User')
    }
    try {
        await Address.updateOne({ _id: addressId }, { $set: req.body });
        const message = "Address updated successfully!";
        return res.status(200).json({ success: true, message: message })
    } catch (e) {
        console.error(e.message);
    }
}

// Delete Address
const deleteAddress = async (req, res) => {
    const { addressId } = req.body;
    // Validate addressId
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(404).render('404User');
    }
    const addId = await Address.findById(addressId)
    if (addId == undefined) {
        return res.status(404).render('404User')
    }

    try {
        await Address.deleteOne({ _id: addressId });
        const message = 'Address deleted Successfully';
        return res.status(200).json({ message: message });
    } catch (e) {
        console.log(e.message);
        //res.status(500).json({ error: 'Server error' });
    }
};

// Show Oreders
const orders = async (req, res) => {
    const userId = req.user.id;
    try {
        const order = await Order.find({ userId: userId }).sort({ createdAt: -1 })
        return res.render('17_orders', { order });
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

// Oreder  Details
const orderDetails = async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.params

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(404).redirect('/orders')
    }
    const ordId = await Order.findById(orderId)
    if (ordId == undefined) {
        return res.status(404).redirect('/orders')
        //return res.status(404).render('404User')
    }

    try {
        const order = await Order.findById({ _id: orderId }).populate('orderItems.productId');
        const user = await User.findById(userId)
        const addressId=order.address;
        const address = await Address.findById(addressId)
        return res.render('17_orderDetails', {
            orderItems: order?.orderItems,
            order,
            user,
            address
        });
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}
// Show Wish List 
const wishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const wishlist = await Wishlist.findOne({ userId: userId }).populate('wishlistItems.productId');
        const product = await Product.find({ isDeleted: false });
        if (!wishlist) {
            return res.render('18_wishList', { wishlistItems: [] });
        }
        return res.render('18_wishList', {
            wishlistItems: wishlist?.wishlistItems,
            product
        });
    } catch (e) {
        //res.status(500).send('An error occurred');
    }
}

const profileSettings = async (req, res) => {
    try {
        return res.render('19_accountSetting');
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}
module.exports = {
    profile,
    address,
    addAddressPage,
    addAddress,
    editAddressPage,
    editAddress,
    deleteAddress,
    orders,
    orderDetails,
    wishlist,
    profileSettings
}