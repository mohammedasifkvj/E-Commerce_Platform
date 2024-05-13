const mongoose=require("mongoose");
const signupSchema= new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true,
        min:10,
        max:10
    },
    password:{
        type:String,
        required:true,
        min:6,
        max:1024
     },
     confirm_password:{
        type:String,
        required:true
     },
    isAdmin:{
        type:Boolean,
        default: false
    },
    isVerified:{
        type:Number,
       default:0
    }
});

module.exports=mongoose.model('User',signupSchema)

