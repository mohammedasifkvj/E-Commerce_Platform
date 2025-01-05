const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        requred: true
    },
    // imageUrl:{
    //     type:String,
    //     requred:true
    // },
    description: {
        type: String,
        requred: true
    },
    status: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

module.exports = mongoose.model('Category', categorySchema)