const { User, TempUser } = require('../models/signup');
const Product = require('../models/product');
const RefreshToken = require('../models/refreshToken');

const otpGenerator = require('otp-generator');
const mailer = require("../drivers/mailer");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
// To load Home
const loadHome = async (req, res) => {
  const { error, success } = req.query
  try {
    const currentDate = new Date();
    const product = await Product.find({ isDeleted: false })
      .populate({
        path: 'offer',
        match: { status: true, expDate: { $gte: currentDate } }
      })

    return res.render('1_home', {
      product,
      error, success
    });
  } catch (e) {
    console.log(e.message);
    return res.status(500).send('Server Error');
  }
};
// To load Home
// const loadHome = async (req, res) => {
//   const {error,success} = req.query
//     try {
//       const product= await Product.find({isDeleted:false})
//         res.render('1_home',{
//           product,
//           error,
//           success
//         });
//     } catch (e) {
//         console.log(e.message);
//     }
// }

// To load SignUp
const loadSignUp = async (req, res) => {
  const { message, success } = req.query
  try {
    return res.render('2_logind85d', {
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
    const message = 'Enter all fields'
    //return res.status(400).json({ message: message,errorVal.details[0].message });
    return res.redirect(`/signUp?error=${encodeURIComponent('All fields are required')}`);
  }
  const { name, email, mobile, password } = req.body;
  // Check if user already exists
  const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (existingUser) {
    const message = 'User already exists, Sign-up with another mail'
    return res.status(400).json({ message: message })
    //return res.redirect(`/signUp?error=${encodeURIComponent('User already exists, Sign-up with another mail')}`);
  }
  // Generate OTP
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


  const OTPmsg = '<p>Hai ' + name + ', this is the OTP: ' + otp + ' for account creation ';

  mailer.sendMail(email, 'Email verification', OTPmsg);
  res.cookie('Timer', otp, hashedOTP, otpExpires, { httpOnly: true })
  return res.redirect(`/otp?success=${encodeURIComponent('OTP is send to your email')}`);
};

// Load OTP page 
const loadOTP = async (req, res) => {
  const { error, success } = req.query
  const timer = req.cookies.Timer
  try {
    const otpExpires = Date.now() + 10 * 60 * 1000;
    // Set the OTP expiration time in a cookie
    res.cookie('otpExpires', otpExpires, { httpOnly: false });
    return res.render('3_otp', {
      success,
      error,
      //otpExpires,
      timer
    });
  } catch (error) {
    console.log(err);
  }
}

const verifyOtp = async (req, res) => {
  // Validate request body
  const { error } = otpSchema.validate(req.body);
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
  const email = user.email
  await TempUser.deleteOne({ email });

  return res.redirect(`/signIn?success=${encodeURIComponent('Your account successfully created,please sign-in')}`);
};

//Resend OTP
const resendOTP = async (req, res) => {
  try {
    const tempUser = await TempUser.findOne({});
    // Generate OTP
  const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
  console.log(otp);
  } catch (e) {
    console.log(e.message);
  }
}

// To load SignIn
const loadSignIn = async (req, res) => {
  const { success, message } = req.query
  try {
    return res.render('4_login', { message, success });
  } catch (e) {
    console.log(e.message);
  }
}
// Sign in
const verifySignIn = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return res.redirect(`/signIn?message=${encodeURIComponent('Enter email')}`);
    }
    if (!password) {
      return res.redirect(`/signIn?message=${encodeURIComponent('Enter password')}`);
    }

    const user = await User.findOne({ email })
    if (!user) {
      const message = 'Account not Found, Please Create an account first'
      return res.status(400).json({ message: message })
    }
    // Checking is user blocked
    if (user.isBlocked === true) {
      const message = "Your Account is Blocked!,You can't sign-in"
      return res.status(403).json({ message: message })
    }
    // Password Matching
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const message = 'Incorrect Password'
      return res.status(401).json({ message: message })
    }

    const accessToken = jwt.sign(
      { id: user._id }, // this is payLoad
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "24h" }
    );

    const refershToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const options = {
      httpOnly: true, // cookies can manipulate by browser only
      secure: true
    }
    // save token in user cookie
    res.cookie('jwtToken', accessToken, options)

    return res.redirect('/home')
  } catch (e) {
    console.log(e);
  }
}

// Google SSO
const googleAuth = async (req, res) => {
  try {
    // Get the user object from req.user
    const user = req.user;
    if (user.isBlocked == true) {
      const message = "Your Account is Blocked!,You can't sign-in"
      //return res.status(403).json({message: message}) // 403 for 
      return res.status(403).redirect(`/signIn?message=${encodeURIComponent("Your Account is Blocked!,You can't sign-in")}`);
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      { id: user._id }, // Use user.id if you have an id field
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "24h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const options = {
      httpOnly: true, // Cookie can only be manipulated by the browser
      secure: true // Cookie will be sent only over HTTPS
    };

    // Save the refresh token in the database
    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    });

    await newRefreshToken.save();

    // Send token in user cookie
    res.cookie('jwtToken', accessToken, options);
    res.cookie('RFToken', refreshToken, options);
    return res.status(200).redirect('/home');
  } catch (e) {
    console.log(e.message);
  }
}

// To load forgot password 
const forgetPW = async (req, res) => {
  try {
    return res.render('5_forgetPW');
  } catch (e) {
    console.log(e.message);
  }
}

//Forget password
const resetPWOTP = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      const message = 'You are not a user, Please Create an account first'
      return res.status(400).json({ message: message })
    }
    if (user.googleId !== null) {
      const message = "Your Account is created using SSO ,Login Using SSO"
      return res.status(403).json({ message: message }) // 403 for 
    }

    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    console.log(otp);

    const otpExpires = Date.now() + 5 * 60 * 1000;

    const OTPmsg = '<p>Hai , this is the OTP: ' + otp + ' for reset your password ,OTP will expire in 5 minute';

    mailer.sendMail(email, 'Email verification', OTPmsg);
    res.cookie('OTP', otp)
    res.cookie('email', email)
    res.cookie('otpExpires', otpExpires)
    return res.status(200).redirect(`/resetOTP?success=${encodeURIComponent('OTP is send to your email')}`);
  } catch (e) {
    console.log(e.message);
  }
}

//Rest Password OTP Page
const loadresetOTP = async (req, res) => {
  const { error, success } = req.query
  try {
    return res.render('3_resetPWotp', {
      success,
      error
    });
  } catch (error) {
    console.log(error);
  }
}

const resetPasswordPage = async (req, res) => {
  const { otp } = req.body;
  try {
    // Validate request body
    const { error } = otpSchema.validate(req.body);
    if (error) {
      return res.redirect(`/resetOTP?error=${encodeURIComponent('OTP is required ,Enter an OTP')}`);
    }
    const OTP = req.cookies.OTP
    const expired = req.cookies.otpExpires

    if (OTP !== otp) {
      return res.redirect(`/resetOTP?error=${encodeURIComponent('Invalid OTP')}`);
    }

    // // Check if OTP has been expired or not
    if (Date.now() > expired) {
      return res.redirect(`/resetOTP?error=${encodeURIComponent('OTP expired ,ask for another')}`);
    }
    res.clearCookie('OTP')
    return res.render('6_resetPassword')
  } catch (e) {
    console.log(e.message);
  }
};

const resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  try {
    // Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate password criteria (8 characters, uppercase, lowercase, number, special character)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])(?!.*\s).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, a special character, and no spaces.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const email = req.cookies.email
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = hashedPassword;
    await user.save();

    res.clearCookie('email')
    res.clearCookie('otpExpires')
    return res.status(200).json({ success: true, message: 'Password Rest Completed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'An error occurred while changing the password' });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie('jwtToken')
    return res.redirect(`/signIn?success=${encodeURIComponent('LOG-OUT SUCCESS')}`);
  } catch (e) {
    console.log(e.message);
  }
}

module.exports = {
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
  resetPasswordPage,
  resetPassword,
  logout
}