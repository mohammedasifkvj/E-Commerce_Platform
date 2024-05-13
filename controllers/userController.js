const User=require("../models/signup")
const bcrypt=require("bcryptjs");
//const nodemailer=require("nodemailer");
// To load home
//the name in views
const loadHome=async(req,res)=>{
  try {
    res.render('1_home')  
  } catch (error) {
    console.log(error.message);  
  }
}
// To load SignUp
const loadSignUp=async(req,res)=>{
  try {
    res.render('2_logind85d')  
  } catch (error) {
    console.log(error.message);  
  }
}

//to hash password
const securePassword=async (password)=>{
  try {
   const passwordHash= await bcrypt.hash(password,10);
   return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}
// To load otp
const loadOTP=async(req,res)=>{
  try {
    res.render('3_otp')  
  } catch (error) {
    console.log(error.message);  
  }
}
// To load SignIn
const loadSignIn=async(req,res)=>{
    try {
      res.render('4_login')  
    } catch (error) {
      console.log(error.message);  
    }
}
// To load forgot password 
const forgetPW=async(req,res)=>{
  try {
    res.render('forgetPW')  
  } catch (error) {
    console.log(error.message);  
  }
}

// const login=(req,res)=>{
//   if(req.body.email==undefined || req.body.password==undefined){
//     res.status(500).send({error:"authontication Failed"});
//   }
//   let email=req.body.email;
//   let password=req.body.password;
//   let qr=` `  
// }

// To load New Release Page
const newRel=async(req,res)=>{
  try {
    res.render('5_newRelease')  
  } catch (error) {
    console.log(error.message);  
  }
}

// To load Mens Page
const mensPage=async(req,res)=>{
  try {
    res.render('6_mens')  
  } catch (error) {
    console.log(error.message);  
  }
}

// To load Womens Page
const womensPage=async(req,res)=>{
  try {
    res.render('7_womens')  
  } catch (error) {
    console.log(error.message);  
  }
}
// To load Cart
const loadCart=async(req,res)=>{
  try {
    res.render('8_cart')  
  } catch (error) {
    console.log(error.message);  
  }
}

// To load Brands
const brands=async(req,res)=>{
  try {
    res.render('brands')  
  } catch (error) {
    console.log(error.message);  
  }
}
// To load Retrun and shipping
const retAndShip=async(req,res)=>{
  try {
    res.render('return_ship')  
  } catch (error) {
    console.log(error.message);  
  }
}

// To load contact us 
const contactUs=async(req,res)=>{
  try {
    res.render('contact_us')  
  } catch (error) {
    console.log(error.message);  
  }
}

module.exports={
loadHome,
loadSignUp,
loadOTP,
loadSignIn,
forgetPW,
newRel,
mensPage,
womensPage,
loadCart,

retAndShip,
contactUs,
brands

}