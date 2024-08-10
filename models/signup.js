const mongoose=require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String,
     required: true },
  email: { type: String,
     required: true,
     unique: true },
  mobile: { type: String,
     required: false },
  password: { type: String,
    required: false },
   isAdmin:{
            type:Boolean,
            default: false
        },
   isBlocked:{
          type:Boolean,
          default: false
       },
      // this will be an assignment
       token:{
            type:String,
            default:null
      },
      googleId:{
      type: String,
      default:null},
      otp:{type:Number,
         required:false},
      otpExpires: { type: Date,
             required: false }
},{timestamps:true});

const tempUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
});


const User = mongoose.model('User', userSchema);
const TempUser = mongoose.model('TempUser', tempUserSchema);

module.exports = { User, TempUser };

//module.exports=mongoose.model('User',signUpSchema)

