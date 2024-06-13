const mongoose=require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
        
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
      }
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

