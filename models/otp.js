const { required, number } = require('@hapi/joi');
const { default: mongoose } = require('mongoose');
const mongoos=require('mongoose');

const Otp=new mongoos.Schema({

    // user_id:{
    //     type:mongoose.Schema.Types.ObjectId,
    //     required:true,
    //     ref:'User'
    // },
    email:{type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now,
        required:true,
        get:(timestamp)=>timestamp.getTime(),
        set:(timestamp)=>new Date(timestamp),
        index:{expires:360}
        //OTP expires after 3 min
    },
},{timestamps:true});

module.exports=mongoos.model("Otp",Otp)

















// const { required, number } = require('@hapi/joi');
// const {Schema,model}=require('mongoose');

// module.exports.Otp=model('Otp',Schema({
//     email:{type:String,
//         required:true
//     },
//     otp:{
//         type:String,
//         required:true
//     },
//     createdAt:{
//         type:Date,
//         default:Date.now,
//         index:{expires:180}
//         //OTP expires after 2.5 min
//     },
// },{timestamps:true}));