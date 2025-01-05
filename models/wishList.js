
const mongoose = require('mongoose')

const wishlistSchema =new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref:'User',
        required: true
    },
    wishlistItems: [
        {
            productId:{
                type:mongoose.SchemaTypes.ObjectId,
                ref:'Product',
                required:true
            }
        }
]

},{timestamps:true})

module.exports = mongoose.model('Wishlist', wishlistSchema)

