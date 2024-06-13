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