const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        requred: true
    },
    category: {
        type: String,
        requred: true
    },
    brand: {
        type: String,
        requred: true
    },
    description: {
        type: String,
        requred: true
    },
    // dialColour:{
    //     type:String,
    //     requred:true
    // },
    // strapColour:{
    //     type:String,
    //     requred:true
    // },
    price: {
        type: Number,
        requred: true
    },
    discountPrice: {
        type: Number,
        requred: false
    },
    stock: {
        type: Number,
        requred: true
    },
    // discount:{
    //     type:Number,
    //     requred:true
    // },
    productImage: [{
        type: String,
        requred: true
    }],
    popularProduct: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    offer: [{
        type: mongoose.Types.ObjectId,
        default: null,
        ref: 'Offer'
    }],
    newProductExpires: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)