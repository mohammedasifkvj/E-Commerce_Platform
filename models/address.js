const mongoose = require ('mongoose')

const addressSchema =new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref:'User',
        required:true
    },
    // name : {
    //     type:String,
    //     required:true
    // },
    // email :{
    //     type:String,
    //     required:true
    // },
    // alternatePhone : {
    //     type:String,
    //     required:false
    // },
    // locality : {
    //     type:String,
    //     required:true
    // },
    houseName : {
        type:String,
        required:true
    },
    landmark : {
        type:String,
        required:true
    },
    city : {
        type:String,
        required:true
    },
    state : {
        type:String,
        required:true
    },
    country : {
        type:String,
        required:true
    },
    pin: {
        type:Number,
        required:true
    },
    is_Home : {
        type:Boolean,
        default:false
    },
    is_Work : {
        type:Boolean,
        default:false
    }    
},{timestamps:true})

module.exports = mongoose.model('Address', addressSchema)
