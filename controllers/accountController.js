const { User} = require('../models/signup');
const Product = require('../models/product');
const Category=require('../models/category')
const Address=require('../models/address')
const Wishlist=require("../models/wishList")
const Order=require("../models/order")
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose')

//const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id; 

const profile = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const userData = await User.findById({ _id: userId })
        res.render('15_account',{userData});
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

const address = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const userData = await User.findById({ _id: userId })
        const address = await Address.find({ userId: userId })
        // console.log(userId)
        // console.log(userData)
        // console.log(address)
        res.render('16_address',{userData, address });

    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

//Add address Page
const addAddressPage = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const userData = await User.findById({ _id: userId })
        const address = await Address.find({ userId: userId })
        // console.log(userData)
        // console.log(address)

        res.render('16_addAddress',{ userData,address });

    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

//Add address
const addAddress = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
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
        console.log('Invalid address ID');
        return res.status(404).render('404User')
        //return res.status(404).send('Invalid address ID');
      }
        const addId= await Address.findById(addressId)
      if(addId== undefined){
        console.log('Invalid or missing address ID');
       return res.status(404).render('404User')
      }
    try {
        const address=await Address.findById(addressId)
        return res.render('16_editAddress',{address});
    } catch (e) {
        console.log(e.message);
    }
}
// Update Address
const editAddress = async (req, res) => {
    const { addressId }  = req.params;
    //console.log(addressId)
    // Validate addressId
  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) { 
    console.log('Invalid address ID');
    return res.status(404).render('404User')
    //return res.status(404).send('Invalid address ID');
  }
    const addId= await Address.findById(addressId)
  if(addId== undefined){
    console.log('Invalid or missing address ID');
   return res.status(404).render('404User')
  }
    try {
        await Address.updateOne({_id: addressId },{ $set: req.body });
        const message="Address updated successfully!";
        return res.status(200).json({ success: true ,message:message})
    } catch (e) {
        console.error(e.message);
    }
}

// Delete Address
const deleteAddress = async (req, res) => {
    const { addressId } = req.body;
    // Validate addressId
  if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) { 
    console.log('Invalid address ID');
    return res.status(404).render('404User');
  }
    const addId= await Address.findById(addressId)
  if(addId== undefined){
    console.log('Invalid or missing address ID');
   return res.status(404).render('404User')
  }
  
    try {
        // const address = await Address.findById(addressId);
        // if (!address) return res.status(404).json({ message: 'Address not found' });

        await Address.deleteOne({ _id: addressId });
          const message='Address deleted Successfully';
        return res.status(200).json({message:message });
    } catch (e) {
        console.log(e.message);
        //res.status(500).json({ error: 'Server error' });
    }
};

// Show Oreders
const orders = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const order = await Order.find({ userId: userId })
        //const product=await Product.find();
        // console.log(order);
        return res.render('17_orders',{ 
            order,
           //product
        });
    } catch (e) {
        console.log(e.message);
        //res.status(500).send('An error occurred');
    }
}

// Oreder  Details
const orderDetails = async (req, res) => {
    const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    const {orderId}=req.params

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) { 
        console.log('Invalid orderId');
        return res.status(404).render('404User')
      }
        const ordId= await Order.findById(orderId)
      if(ordId== undefined){
        console.log('Invalid or missing order ID');
       return res.status(404).render('404User')
      }
    try {
      const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
      const address=await Address.findOne({ userId: userId })

        const order = await Order.findById({ _id:orderId }).populate('orderItems.productId');
        const user=await User.findById(userId)
        //const product=await Product.find();
        return res.render('17_orderDetails',{
            orderItems: order?.orderItems ,
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
const wishlist= async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const wishlist = await Wishlist.findOne({ userId: userId }).populate('wishlistItems.productId');
        const product=await Product.find({isDeleted:false});
        // console.log(userId);
        // console.log(wishlist);
        // console.log(product);
        if (!wishlist) {
            return res.render('18_wishList', { wishlistItems: [] });
        }

        return res.render('18_wishList',{ wishlistItems: wishlist.wishlistItems ,
            product
        });
    } catch (e) {
        console.log(e.message);
        console.log(e);
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
module.exports={
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