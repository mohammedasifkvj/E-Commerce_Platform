const { required } = require('@hapi/joi')
const { type } = require('@hapi/joi/lib/extend')
const mongoose = require('mongoose')

const orderSchema =new mongoose.Schema({
    userId :{
        type : mongoose.SchemaTypes.ObjectId,
        ref:'User',
        required : true
    },
    orderItems :[{
        productId : {
            type:mongoose.SchemaTypes.ObjectId,
            ref:'Product',
            required:true
        },
        quantity: {
            type: Number,
            required: true,
            default : 1
        }  
    }],
    orderTotal:{
        type: Number,
        required: true
    },
    address : {
        type:mongoose.SchemaTypes.ObjectId,
        ref:'Address',
        required:true
        },
     paymentMethod:{
        type:String,
        required:true
     },
     status:{
        type:String,
        required:true,
        default:"pending"
     } 
},{timestamps:true})

module.exports = mongoose.model('Order',orderSchema)