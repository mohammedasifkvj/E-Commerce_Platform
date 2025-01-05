const dotenv = require("dotenv").config()
const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port:process.env.SMTP_HOST,
    secure:false,
    requireTLS:true,
    auth:{
      user:process.env.EMAIL_USER,
      pass:process.env.EMAIL_PASS
    }
  });

  const sendMail=async(email,subject,content)=>{
    try {
        const mailOptions={
            from:process.env.EMAIL_USER,
            to:email,
            subject:subject,
            html:content
          }

          transporter.sendMail(mailOptions,(error,info)=>{
            if (error) {
                console.log(error);
              }
              console.log("OTP has been sent to your email:- ");
          })
    } catch (error) {
        console.log(error.message);
    }
  }

module.exports={
    sendMail
}
//------------------------------------------------------
// nodemailer.createTransport({
//                         host:'smtp.gmail.com',
//                         port:587,
//                         secure:false,
//                         requireTLS:true,
//                         auth:{
//                           user:EMAIL_USER,
//                           pass:EMAIL_PASS
//                         }
//                       });
//                       const mailOptions={
//                         from:process.env.EMAIL_USER,
//                         to:email,
//                         subject:"For verification",
//                         html:'<p>Hai '+name+',this is your '+otp+'for verifiction </p>'
//                       }
//                       transporter.sendMail(mailOptions,function(error,info){
//                         if (error) {
//                           console.log(error);
//                         }else{
//                           console.log("Email has been sent:- ",info.response);
//                           return res.status(200).send('OTP send successfully');
//                         }
//                       })