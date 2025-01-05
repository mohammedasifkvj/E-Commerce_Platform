const Joi = require("@hapi/joi");

// SignUp validation
 const signUpValidation = (req,res,next)=> {
    const signUpSchema = {
        name: Joi.string().min(6).required(),
        email: Joi.string().min(8).required(),
        password: Joi.string().min(8).required(),
        
    };
    return Joi.validate(data, schema);
};

// Signin validation
const signInValidation = data => {
    const signInSchema = {
        //email: Joi.string().min(8).required(),
        password: Joi.string().min(8).required(),
    };
    return Joi.validate(data,schema);
};

module.exports={
    signUpValidation,
    signInValidation
}
//-------------------------------------------------------------
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey'; // Replace with your actual secret key

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt; // Assuming the JWT token is stored in a cookie named 'jwt'
  
  if (!token) {
    return res.status(401).send('Access Denied: No Token Provided!');
  }
  
  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};
