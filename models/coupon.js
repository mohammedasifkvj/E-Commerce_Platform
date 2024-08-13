const mongoose = require('mongoose')

const couponSchema = mongoose.Schema({
      couponCode :{  
        type:String,
        required:true,
        unique: true,
      },
      discountPercentage:{
        type:Number,
        required:true
      },
      expiredDate:{
        type: Date,
        required: true,
      },
      minPurchaseAmt:{
        type:Number,
        required:true
      },
      maxRedimabelAmount:{
        type:Number,
        required:true
      },
      status:{
        type:Boolean,
        default:true
      }
},{timestamps:true})


module.exports = mongoose.model('Coupon',couponSchema)