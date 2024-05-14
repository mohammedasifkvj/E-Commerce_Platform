const Joi = require('@hapi/joi');

// SignUp validation
// const signUpValidation = data => {
    const signUpSchema = {
        name: Joi.string().min(6).required(),
        email: Joi.string().min(8).required(),
        password: Joi.string().min(8).required(),
    };
//     return Joi.valida(data, schema);
// };

// Signin validation
//const signInValidation = data => {
    const signInSchema = {
        email: Joi.string().min(8).required(),
        password: Joi.string().min(8).required(),
    };
//     return Joi.valida(data,schema);
// };

module.exports={
    signUpValidation,
    signInValidation
}