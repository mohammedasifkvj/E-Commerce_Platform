const mongoose = require('mongoose')

const productSchema =new mongoose.Schema({
    productName :{
        type:String,
        requred:true
    },
    category:{
        type:String,
        requred:true
    },
    brand:{
        type:String,
        requred:true
    },
    // model:{
    //     type:String,
    //     requred:true
    // },
    description:{
        type:String,
        requred:true
    },
    price:{
        type:Number,
        requred:true
    },
    discountPrice:{
        type:Number,
        requred:true
    },
    // discount:{
    //     type:Number,
    //     requred:true
    // },
    // dialColor:{
    //     type:String,
    //     requred:true
    // },
    // strapColor:{
    //     type:String,
    //     requred:true
    // },
    // image:[{
    //     type:String,
    //     requred:true
    // }],
    status:{
        type:Boolean,
        default:true
    },
    stock:{
        type:Number,
        requred:true
    },
    // popularProduct:{
    //     type:Boolean,
    //     default:false
    // },
    isDeleted:{
        type:Boolean,
        default:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // offer: [{
    //     type: mongoose.Types.ObjectId,
    //     default: null,
    //     ref: 'Offer'
    // }]
})

module.exports=mongoose.model('Products',productSchema)