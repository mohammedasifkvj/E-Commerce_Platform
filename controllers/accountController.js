const { User } = require('../models/signup');
const Product = require('../models/product');
const Category = require('../models/category')
const Address = require('../models/address')
const Wishlist = require("../models/wishList")
const Order = require("../models/order")
const Wallet = require("../models/wallet")

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

//requestForReturn
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
    } catch (error) {
        console.log(error);
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
        if (orderData.paymentMethod === 'Online' || orderData.paymentMethod === 'UserWallet') {
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
        console.error('Error occurred while cancelling order:', error.message);
        res.status(500).json({ message: 'An error occurred while Cancelling Order' });
    }
};

// wallet Page
// Backend route to load the wishlist page with wallet details
// Controller to render the wallet page
const wallet = async (req, res) => {
    try {
      const userId = req.user.id; // Assuming you have user authentication middleware to get user ID
  
      // Fetch the wallet details for the user
      const wallet = await Wallet.findOne({ userId: userId });
  
      if (!wallet) {
        return res.render('19_ wallet', {
          walletAmount: 0,
          transactionHistory: [],
        });
      }
  
      // Render the wallet page and pass wallet details to the EJS template
      return res.render('19_ wallet', {
        walletAmount: wallet.walletAmount.toFixed(2),
        transactionHistory: wallet.transactionHistory,
      });
    } catch (error) {
      console.error('Error rendering wallet page:', error.message);
      res.status(500).send('Server Error');
    }
  };
  

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
    requestForReturn,
    cancellOrder,
    wishlist,
    wallet,
    profileSettings
}