const { User, TempUser } = require('../models/signup');
const Product = require('../models/product');
const nodemailer = require('nodemailer');
//const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const mailer=require("../drivers/mailer");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const cookieParser=require('cookie-parser')

const { OAuth2Client } = require('google-auth-library');
// To load Home
const loadHome = async (req, res) => {
  const {error,success} = req.query
    try {
      const product= await Product.find()
        res.render('1_home',{
          product,
          error,
          success
        });
    } catch (e) {
        console.log(e.message);
    }
}

// To load SignUp
const loadSignUp = async (req, res) => {
  const {error,success} = req.query
     try {
        res.render('2_logind85d',{
          error,
          success
        });
    } catch (e) {
        console.log(e.message);
    }
}

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().pattern(/^[0-9]{10,15}$/).min(10).max(10).required(),
  password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required()
});

const otpSchema = Joi.object({
  //email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const requestOtp = async (req, res) => {
  // Validate request body
  const { error } = signupSchema.validate(req.body);
  if (error) {
    //return res.status(400).json({ message: errorVal.details[0].message });
    return res.redirect(`/signUp?error=${encodeURIComponent('All fields are required')}`);
  }
  const { name, email, mobile, password } = req.body;
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.redirect(`/signUp?error=${encodeURIComponent('User already exists, Sign-up with another mail')}`);
  }
  // Generate OTP
  //const otp = crypto.randomBytes(3).toString('hex');
  const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  console.log(otp);

  // 3 minutes expiry
  const otpExpires = Date.now() + 3 * 60 * 1000; 

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  //const hashedOTP = await bcrypt.hash(otp, 10);

  // Save temporary user with OTP and expiration time
  const tempUser = new TempUser({
    name,
    email,
    mobile,
    password: hashedPassword,
    otp,
    otpExpires
  });

  await tempUser.save();

 
const OTPmsg='<p>Hai '+name+', this is the OTP: '+otp+' for account creation ';

        mailer.sendMail(email,'Email verification',OTPmsg);
      return res.redirect(`/otp?success=${encodeURIComponent('OTP is send to your email')}`);
};

// Load OTP page 
const loadOTP=async (req, res) => {
  const {error,success} = req.query
    // try {
       return res.render('3_otp',{
          success,
          error
        });
      }

const verifyOtp = async (req, res) => {
  // Validate request body
  const { error} = otpSchema.validate(req.body);
  if (error) {
    //return res.status(400).json({ message: errorVal.details[0].message });
    return res.redirect(`/otp?error=${encodeURIComponent('OTP is required ,Enter an OTP')}`);
  }

  const { otp } = req.body;
  //const hashedOTP = await bcrypt.hash(otp, 10);

  // Find temporary user by email and OTP
  const tempUser = await TempUser.findOne({ otp });

  if (!tempUser) {
    return res.redirect(`/otp?error=${encodeURIComponent('Invalid OTP')}`);
  }

  // Check if OTP has been expired or not
  if (Date.now() > tempUser.otpExpires) {
    return res.redirect(`/otp?error=${encodeURIComponent('OTP expired ,ask for another')}`);
  }

  // If OTP is valid, save user data to permanent collection
  const user = new User({
    name: tempUser.name,
    email: tempUser.email,
    mobile: tempUser.mobile,
    password: tempUser.password,
  });

  await user.save();

  // Remove temporary user data
  const email=user.email
  await TempUser.deleteOne({email});

  // Create JWT access and refresh tokens
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_ACCESS_SECRET, 
    // { expiresIn: '12h' }
  );

 // const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  user.accessToken=token;
  user.password=undefined  // it will sent to front-end (client)

  const options={
    //expires:new Date(Date.now()+7*24*60*60*1000)   // 7day expiry
    httpOnly:true , // cookies can manipulate by browser only
    secure: true
   }
      // send token in user cookie
  res.cookie('jwtToken',token,options)

  return res.redirect(`/signIn?success=${encodeURIComponent('Your account successfully created,please sign-in')}`);
};

// To load SignIn
const loadSignIn = async (req, res) => {
  const {error,success} = req.query
   try {
      res.render('4_login',{
        error,
        success
      });
  } catch (e) {
      console.log(e.message);
  }
}
// Sign in
const verifySignIn=async(req,res)=>{
  try {
    const {email,password}=req.body

if(!(email && password)){
     return res.redirect(`/signIn?error=${encodeURIComponent('Enter all Fields')}`);
    } 
    //query from DB
    const user=await User.findOne({email})
    if (!user) {
       console.log(' Account not Found');
       return res.redirect(`/signIn?error=${encodeURIComponent('Account not Found, Please Create an account first')}`);
    }

      const passwordMatch=await bcrypt.compare(password,user.password);

      if (!passwordMatch) {
       // console.log('Invalid credentials');
       return res.redirect(`/signIn?error=${encodeURIComponent("Email or password is incorrect")}`); // 401 for unauthorized
      }

      if (user.isBlocked===true) {
       return res.redirect(`/signIn?error=${encodeURIComponent("Your Account is Blocked!,You can't sign-in")}`); // 401 for unauthorized
       }
       const token=jwt.sign(
        {id:user._id},
        process.env.JWT_ACCESS_SECRET,
        // {expiresIn:"24h"}
       );

       user.accessToken=token;
       user.password=undefined 

       const options={
       // expires:new Date(Date.now()+7*24*60*60*1000)   // 7day expiry
       httpOnly:true , // cookies can manipulate by browser only
       secure: true
      }
       // send token in user cookie
      res.cookie('jwtToken',token,options)

    //user.lastLogin = new Date();
    //await user.save();(ERROR)

       return res.redirect('/home')  
  } catch (e) {
    console.log(e.message);
  }
}

// Google SSO
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//    const googleVerify=async (token)=> {
//      const ticket = await client.verifyIdToken({
//        idToken: token,
//        audience: process.env.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//      });
//      const payload = ticket.getPayload();
//      const userid = payload['sub'];
//      console.log(payload);
//      // If request specified a G Suite domain:
//      // const domain = payload['hd'];
//    }

// To load forgot password 
const forgetPW = async (req, res) => {
  try {
      res.render('5_forgetPW');
  } catch (e) {
      console.log(e.message);
  }
}

// // To load New Release Page
const newRel = async (req, res) => {
  const { error, success } = req.query;
  try {
      const product= await Product.find({isDeleted:false });
      return res.render('7_newRelease', { product});
  } catch (e) {
      console.log(e.message);
  }
};

// To load Mens Page
const mensPage = async (req, res) => {
  const { error, success } = req.query;
  try {
      const product= await Product.find({category:"Mens" ,isDeleted:false });
      return res.render('8_mens', { product});
  } catch (e) {
      console.log(e.message);
  }
};

// To load Womens Page
const womensPage = async (req, res) => {
  const { error, success } = req.query;
  try {
      const product= await Product.find({ category:"Womens",isDeleted:false });
      return res.render('9_womens', { product});
  } catch (e) {
      console.log(e.message);
  }
};

// To load Cart
const loadCart = async (req, res) => {
  try {
      res.render('10_cart');
  } catch (e) {
      console.log(e.message);
  }
}

// To load Product Page
const productShow = async (req, res) => {
  try {
      res.render('11_product');
  } catch (e) {
      console.log(e.message);
  }
}

// To load Brands Page
const brands = async (req, res) => {
  try {
      res.render('brands');
  } catch (e) {
      console.log(e.message);
  }
}

// To load Return and Shipping Page
const retAndShip = async (req, res) => {
  try {
      res.render('return_ship');
  } catch (e) {
      console.log(e.message);
  }
}

// To load Contact Us Page
const contactUs = async (req, res) => {
  try {
      res.render('contact_us');
  } catch (e) {
      console.log(e.message);
  }
}

// Lpg-Out
const logout=async(req,res)=>{
  try {
      const token=req.body.token|| req.query.token || req.headers["authorization'"];

      const bearer=token.split(' ')
      const bearerToken=bearer[1]

      const newBlacklist=new Blacklist({
          token:bearerToken
      })

      await newBlacklist.save()
      res.setHeader('Clear-Site-Data','"cookies","storage"')
      return res.redirect('/1_home')

  } catch (e) {
    console.log(e.message);
  }
}
module.exports={
    loadHome,
    loadSignUp,
    requestOtp,
    loadOTP,
    verifyOtp,
    //googleVerify,
    loadSignIn,
    verifySignIn,
    forgetPW,
    newRel,
    mensPage,
    womensPage,
    loadCart,
    productShow,
    retAndShip,
    contactUs,
    brands,
    logout
}