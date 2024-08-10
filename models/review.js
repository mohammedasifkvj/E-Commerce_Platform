
const mongoose = require('mongoose')

const reviewSchema =new mongoose.Schema({
    productId: {
        type: mongoose.Types.ObjectId,
        ref:'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true },
    name: { 
        type: String,
        required: true },
    productName: { 
        type: String,
        required: true },
     comments: {
        type: String,
        required: true
     }
},{timestamps:true})

module.exports = mongoose.model('Review', reviewSchema)

