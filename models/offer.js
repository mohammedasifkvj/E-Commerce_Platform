const mongoose = require('mongoose')

const offerSchema = mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: false
    },
    productName: {
        type: String,
        required: false
    },
    discount: {
        type: Number,
        required: true
    },
    expDate: {
        type: Date,
        required: true
    },
    maxRedeemableAmount: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
},{timestamps:true})

module.exports = mongoose.model('Offer', offerSchema)
