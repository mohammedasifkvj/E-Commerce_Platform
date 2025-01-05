 const {check}=require('express-validator');



 exports.signUpValidation=[
    
    check('name','Name is required').not().isEmpty(),
    check('email','Enter a valid Email ').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('number','Phone Number must contain 10 digits').isLength({
        min:10,max:10
    }),
    check('password','Password must contain at least 6 characters ,at least one upper-case and lower_case letters,one  number and one special characters').isStrongPassword({
        minLength:6,
        minUppercase:1,
        minLowercase:1,
        minNumbers:1,
        minSymbols:1
    })
 ]

 exports.signInValidation=[
    check('email','Enter a valid E-mail ').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('passsword','Password is required').not().isEmpty()
 ];

 exports.otpMailValidation=[
    check('email','Enter a valid Email ').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
 ]

 exports.verifyOTOValidation=[
    check('otp','OTP is required').not().isEmpty()
 ]

 