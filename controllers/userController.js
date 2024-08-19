 const { User, TempUser } = require('../models/signup');
const Product = require('../models/product');
const Category=require('../models/category')
const Review=require("../models/review")
const RefreshToken = require('../models/refreshToken');
const nodemailer = require('nodemailer');
//const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const mailer=require("../drivers/mailer");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const cookieParser = require('cookie-parser');
const passport=require('passport')
const mongoose = require('mongoose')

const { OAuth2Client } = require('google-auth-library');
// To load Home
const loadHome = async (req, res) => {
  const {error,success} = req.query
    try {
      const product= await Product.find({isDeleted:false})
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
  const {message,success} = req.query
     try {
        res.render('2_logind85d',{
          message,
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
  mobile: Joi.string().pattern(/^[0-9]{10,15}$/).min(10).required(),
  password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])')).required()
}).options({ stripUnknown: true });

const otpSchema = Joi.object({
  //email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const requestOtp = async (req, res) => {
  // Validate request body
  const { error } = signupSchema.validate(req.body);
  if (error) {
    console.log(error);
    const message='Enter all fields'
    //return res.status(400).json({ message: message,errorVal.details[0].message });
    return res.redirect(`/signUp?error=${encodeURIComponent('All fields are required')}`);
  }
  const { name, email, mobile, password } = req.body;
  // Check if user already exists
  const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`,'i') }  });
  if (existingUser) {
    const message='User already exists, Sign-up with another mail'
    return res.status(400).json({message: message})
    //return res.redirect(`/signUp?error=${encodeURIComponent('User already exists, Sign-up with another mail')}`);
  }
  // Generate OTP
  //const otp = crypto.randomBytes(3).toString('hex');
  const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  console.log(otp);

  // 10 minutes expiry
  const otpExpires = Date.now() + 10 * 60 * 1000; 


  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  hashedOTP = await bcrypt.hash(otp, 10);

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
      res.cookie('Timer',otp,hashedOTP,otpExpires,{ httpOnly: true })
      return res.redirect(`/otp?success=${encodeURIComponent('OTP is send to your email')}`);
};

// Load OTP page 
const loadOTP=async (req, res) => {
  const {error,success} = req.query
  const timer = req.cookies.Timer
    // try {
    // Assume OTP expires in 1 minutes from now for this 
  const otpExpires = Date.now() + 1 * 60 * 1000;
  // Set the OTP expiration time in a cookie
  res.cookie('otpExpires', otpExpires, { httpOnly: false });
       return res.render('3_otp',{
          success,
          error,
          //otpExpires,
          timer
        });
      }

const verifyOtp = async (req, res) => {
  // Validate request body
  const { error} = otpSchema.validate(req.body);
  if (error) {
    //return res.status(400).json({ message: errorVal.details[0].message });
    return res.redirect(`/otp?error=${encodeURIComponent('6 digit OTP is required ,Enter an OTP')}`);
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

  // Remove temporary user data from DB
  const email=user.email
  await TempUser.deleteOne({email});

  return res.redirect(`/signIn?success=${encodeURIComponent('Your account successfully created,please sign-in')}`);
};

//Resend OTP
const resendOTP=async (req, res) => {
   try {
    const tempUser = await TempUser.findOne({ otp });
      
  } catch (e) {
      console.log(e.message);
  }
}

// To load SignIn
const loadSignIn = async (req, res) => {
  const {success,message} = req.query
   try {
      res.render('4_login',{
        message,
        success,
      });
  } catch (e) {
      console.log(e.message);
  }
}
// Sign in
const verifySignIn=async(req,res)=>{
  try {
    const {email,password}=req.body

if(!email ){
     return res.redirect(`/signIn?message=${encodeURIComponent('Enter email')}`);
    } 
    if(! password){
      return res.redirect(`/signIn?message=${encodeURIComponent('Enter password')}`);
     } 
    //query from DB
    const user=await User.findOne({email})
    if (!user) {
       //console.log(' Account not Found');
       const message='Account not Found, Please Create an account first'
       return res.status(400).json({message: message})
    }
 // Checking is user blocked
    if (user.isBlocked===true) {
      const message="Your Account is Blocked!,You can't sign-in"
     return res.status(403).json({message: message}) // 403 for 
     }
   // Password Matching
      const passwordMatch=await bcrypt.compare(password,user.password);
      if (!passwordMatch) {
       // console.log('Invalid credentials');
       const message='Incorrect Password'
       return res.status(401).json({message: message}) // 401 for unauthorized
      }

       const accessToken=jwt.sign(
        {id:user._id}, // this is payLoad
        process.env.JWT_ACCESS_SECRET,
         {expiresIn:"24h"}
       );

       const refershToken=jwt.sign(
        {id:user._id},   //
        process.env.JWT_REFRESH_SECRET,
         {expiresIn:"7d"}
       );

       user.token=accessToken;
       user.password=undefined 

       const options={
       // expires:new Date(Date.now()+7*24*60*60*1000)   // 7day expiry
       httpOnly:true , // cookies can manipulate by browser only
       secure: true
      }
       // send token in user cookie
      res.cookie('jwtToken',accessToken,options)

    //user.lastLogin = new Date();
    //await user.save();(ERROR)

      return res.redirect('/home')  
  } catch (e) {
    console.log(e.message);
  }
}

// Google SSO
const googleAuth = async (req, res) => {
  try{
  // Get the user object from req.user
  const user = req.user;
  if (user.isBlocked==true) {
    const message="Your Account is Blocked!,You can't sign-in"
   //return res.status(403).json({message: message}) // 403 for 
   return res.status(403).redirect(`/signIn?message=${encodeURIComponent("Your Account is Blocked!,You can't sign-in")}`);
   }

  // Generate JWT token
  const accessToken = jwt.sign(
      {id:user._id}, // Use user.id if you have an id field
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "24h" }
  );

  const refreshToken=jwt.sign(
    {id:user._id},   //
    process.env.JWT_REFRESH_SECRET,
     {expiresIn:"5m"}
   );

  const options = {
    // expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days expiry
      httpOnly: true, // Cookie can only be manipulated by the browser
      secure: true // Cookie will be sent only over HTTPS
  };

  // Save the refresh token in the database
  const newRefreshToken = new RefreshToken({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 7*24*60*60*1000) // 7 days expiry
});

await newRefreshToken.save();

  // Send token in user cookie
  res.cookie('jwtToken', accessToken, options);

  res.cookie('RFToken', refreshToken, options);
  return res.status(200).redirect('/home');
   }catch (e) {
      console.log(e.message);
  }
}

// To load forgot password 
const forgetPW = async (req, res) => {
  try {
      res.render('5_forgetPW');
  } catch (e) {
      console.log(e.message);
  }
}

//Forget password
const resetPWOTP= async (req, res) => {
  const {email}=req.body
  try {
      const user=await User.findOne({email})
    if (!user) {
       //console.log(' Account not Found');
       const message='You are not a user, Please Create an account first'
       return res.status(400).json({message: message})
    }
    if (user.googleId !== null) {
      const message="Your Account is created using SSO ,You can't Reset Password"
     return res.status(403).json({message: message}) // 403 for 
     }

     const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

     console.log(otp);

     const otpExpires = Date.now() + 5* 60 * 1000;

     const OTPmsg='<p>Hai , this is the OTP: '+otp+' for reset your password ,OTP will expire in 5 minute';

     mailer.sendMail(email,'Email verification',OTPmsg);
     res.cookie('OTP',otp,email,otpExpires)
      return res.status(200).redirect(`/resetOTP?success=${encodeURIComponent('OTP is send to your email')}`);
  } catch (e) {
      console.log(e.message);
  }
}

//Rest Password OTP Page
const loadresetOTP=async (req, res) => {
  const {error,success} = req.query
    // try {
       return res.render('3_resetPWotp',{
          success,
          error
        });
      }
//Rest Password 
const resetPassword= async (req, res) => {
  const { otp } = req.body;
  console.log(req.body);
  try { 
    // Validate request body
  const { error} = otpSchema.validate(req.body);
  if (error) {
    //return res.status(400).json({ message: errorVal.details[0].message });
    return res.redirect(`/resetOTP?error=${encodeURIComponent('OTP is required ,Enter an OTP')}`);
  }
  const OTP=req.cookies.OTP
  const expired=req.cookies.otpExpires
console.log('This is OTP',OTP);
  //const user = await User.findOne({ otp });

  if (OTP!==otp) {
    return res.redirect(`/resetOTP?error=${encodeURIComponent('Invalid OTP')}`);
  }

  // // Check if OTP has been expired or not
  if (Date.now() > expired) {
    return res.redirect(`/resetOTP?error=${encodeURIComponent('OTP expired ,ask for another')}`);
  }

  return res.render('6_resetPassword')
 
  } catch (e) {
      console.log(e.message);
  }
};
// // To load New Release Page
const newRel = async (req, res) => {
  try { 
     const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of offers per page
        const skip = (page - 1) * limit;

      const product= await Product.find({isDeleted:false, 
         newProductExpires :{$gt:Date.now()}
        }).skip(skip).limit(limit);
      return res.render('7_newRelease', { product});
  } catch (e) {
      console.log(e.message);
  }
};

// To load Mens Page 
const mensPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of Product per page
        const skip = (page - 1) * limit;

    
   // const category=await Category.find({isDeleted:false})
      const product= await Product.find({category:"Mens" ,isDeleted:false }).skip(skip).limit(limit);
      const totalProduct = await Product.countDocuments()
      const totalPages = Math.ceil(totalProduct/limit);

      return res.render('8_mens', { 
        product,
        currentPage: page,
        totalPages
      });
  } catch (e) {
      console.log(e.message);
  }
};

// To load Womens Page
const womensPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of offers per page
        const skip = (page - 1) * limit;
  
  try {
      const product= await Product.find({ category:"Womens",isDeleted:false }).skip(skip).limit(limit);
      const totalProduct = await Product.countDocuments()
      const totalPages = Math.ceil(totalProduct/limit);
      return res.render('9_womens', { 
        product,
        currentPage: page,
        totalPages
      });
  } catch (e) {
      console.log(e.message);
  }
};

// To load Product Page
const productShow = async (req, res) => {
  try {
const { productId } = req.params;
 // console.log(productId);
  // Validate productId
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) { 
   // console.log('Invalid product ID');
   return res.status(404).render('404User')
  }
    const prodId= await Product.findById(productId)
  if(prodId== undefined){
    console.log('Invalid or missing product ID');
   return res.status(404).render('404User')
  }

    const product= await Product.findById(productId);
    // Find related products in the same category, excluding the current product
    const relatedProducts = await Product.find({
      category: product.category,  
      _id: { $ne: productId } // Exclude the current product
    }).limit(6); // Limit the number of related products
    
    // const productName = product?.productName;
    // const category = product?.category;
      res.render('Details page',{
        product,
        relatedProducts
      });
  } catch (e) {
      console.log(e.message);
  }
}

//   { productId: '668b854eb06d955923231980' }
// 668b854eb06d955923231980
// { productId: 'undefined' }
// undefined
// Cast to ObjectId failed for value "undefined" (type string) at path "_id" for model "Product"

// Review of the product
const postReview = async (req, res) => {
  const { productId } = req.params;
  const {rating,name,productName,comments}=req.body
  // console.log(req.body)
  // console.log(productId);
  try {
         const review = new Review({
            productId,
            rating,
            name,
            productName,
            comments
          })
          await review.save();
          return res.status(200).json({ message: 'Thanks for your review' });
      }catch (e) {
      console.log(e);
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

// Log-Out
// const logout=async(req,res)=>{
//   try {
//       const token=req.body.token|| req.query.token || req.headers["authorization'"];

//       const bearer=token.split(' ')
//       const bearerToken=bearer[1]
//       const newBlacklist=new Blacklist({
//           token:bearerToken
//       })
//       await newBlacklist.save()
//       res.setHeader('Clear-Site-Data','"cookies","storage"')
//       return res.redirect('/1_home')

//   } catch (e) {
//     console.log(e.message);
//   }
// }
const logout=async(req,res)=>{
  try {
   res.clearCookie('jwtToken') 
   return res.redirect(`/signIn?success=${encodeURIComponent('LOG-OUT SUCCESS')}`);
  } catch (e) {
    console.log(e.message);
  }
 }

 // search Product 
// const searchProduct = async (req, res) => {
//   try {
//       
//       const userId = req.user.id;
//       const userData = null
//       if (userId) {
//           userData = await User.findById({ _id: userId })
//       }

//       // pagination setting
//       const currentPage = parseInt(req.query.page)
//       const productPerPage = 28
//       const skip = (currentPage - 1) * productPerPage;

//       const totalProduct = await User.countDocuments()
//       const totalPages = Math.ceil(totalProduct / productPerPage)
//       //pagination end


//       const productData = []
//       const categoryData = await Category.find({ isDeleted: false })
//       //const color = await Product.distinct('strapColor')
//       const Brand = await Product.distinct('brand')
//       const allProduct = await Product.find({ isDeleted: false })

//       if (req.query.search_query) {
//           productData = await Product.find({
//               $and: [
//                   { isDeleted: false },
//                   {
//                       $or: [
//                           { productName: { $regex: req.query.search_query, $options: 'i' } },  //search_query is the name in html as name (186)
//                           { category: { $regex: req.query.search_query, $options: 'i' } },
//                           { brand: { $regex: req.query.search_query, $options: 'i' } }
//                       ]
//                   }
//               ]
//           }).skip(skip).limit(productPerPage);
//           res.render('1_home', { user: userData, product: productData, category: categoryData,
//              //color: color,
//               brand: Brand, currentPage, totalPages, allProduct })
//       } else {
//           res.render('1_home', { user: userData, product: productData, category: categoryData, 
//             //color: color,
//              brand: Brand, currentPage, totalPages, allProduct })

//       }

//   } catch (e) {
//       console.log(e.message);
//   }
// }

const searchProduct = async (req, res) => {
  try {
      // const userId = req.user.id;
      // const userData = null;
      // if (userId) {
      //     userData = await User.findById({ _id: userId });
      // }

      // pagination setting
      const currentPage = parseInt(req.query.page) || 1;
      const productPerPage = 28;
      const skip = (currentPage - 1) * productPerPage;

      const totalProduct = await User.countDocuments();
      const totalPages = Math.ceil(totalProduct / productPerPage);
      // pagination end

      let productData = [];
      const categoryData = await Category.find({ isDeleted: false });
      const Brand = await Product.distinct('brand');
      const allProduct = await Product.find({ isDeleted: false });

      let origin = req.query.origin // Default to home if no origin is specified
     console.log(origin);
      if (req.query.search_query) {
          productData = await Product.find({
              $and: [
                  { isDeleted: false },
                  {
                      $or: [
                          { productName: { $regex: req.query.search_query, $options: 'i' } },
                          { category: { $regex: req.query.search_query, $options: 'i' } },
                          { brand: { $regex: req.query.search_query, $options: 'i' } }
                      ]
                  }
              ]
          }).skip(skip).limit(productPerPage);
      }

      let template;
      switch (origin) {
          case 'mens':
              template = '8_mens';
              break;
          case 'womens':
              template = '9_womens';
              break;
              case 'newRel':
              template = '7_newRelease';
              break;
          default:
              template = '1_home';
      }

      res.render(template, { 
          //user: userData, 
          product: productData, 
          category: categoryData, 
          brand: Brand, 
          currentPage, 
          totalPages, 
          allProduct 
      });

  } catch (e) {
      console.log(e);
      //return res.status(500).json({message:'Internal Server Error'});
  }
};




 module.exports={
    loadHome,
    loadSignUp,
    requestOtp,
    loadOTP,
    verifyOtp,
    resendOTP,
    googleAuth,
    loadSignIn,
    verifySignIn,
    forgetPW,
    resetPWOTP,
    loadresetOTP,
    resetPassword,
    logout,
    newRel,
    mensPage,
    womensPage,
    productShow,
    postReview,
    searchProduct,
    retAndShip,
    contactUs,
    brands 
}