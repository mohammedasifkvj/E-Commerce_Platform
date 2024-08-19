const jwt=require('jsonwebtoken')
const {User} = require('../models/signup');


exports.isLoggedIn = async(req,res,next)=>{
   const token = req.cookies.jwtToken
    if(req.cookies && req.cookies.jwtToken){
       // console.log('hello')
        const userId = jwt.decode(req.cookies.jwtToken).id
        const userStatus = await User.findOne({_id:userId})
        
        // jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        //     if (err) {
        //         console.log("error verification");
        //         // res.sendStatus(403);
        //         return res.redirect(`/admin/login?error=${encodeURIComponent(' verification error')}`);
        //     }
        //     req.user = user;
        //    // next();
        // });
        if(userStatus){
            res.redirect('/')
        }
        else{
            next()
        }
    }else{   
        next()
    } 
}

exports.isAdminLoggedIn = async(req,res,next)=>{
    const token = req.cookies.JWTToken
    if(req.cookies && req.cookies.JWTToken){
       // console.log(token)
        const userId = jwt.decode(req.cookies.JWTToken).id
        const userStatus = await User.findOne({_id:userId})
        //console.log(userStatus)
        
        if(userStatus && userStatus.isAdmin){
            // jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        //     if (err) {
        //         console.log("error verification");
        //         // res.sendStatus(403);
        //         return res.redirect(`/admin/login?error=${encodeURIComponent(' verification error')}`);
        //     }
        //     req.user = user;
        //     next();
        // });
         res.redirect('/admin/dash')
        }
        else{
            next()
        }
    }else{   
        next()
    } 
}

