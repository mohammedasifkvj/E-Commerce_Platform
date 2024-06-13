const jwt =require('jsonwebtoken');
const blacklist=require('../models/blacklist')

const config=process.env;

const verifyToken=async (req,res,next)=>{

    const token=req.body.token|| req.query.token || req.headers["authorization'"];

    if(! token){
      return  res.redirect('/4_login');
    }

    try {
        const bearer=token.split(' ')
        const bearerToken=bearer[1]

        const blackListedToken=await blacklist.findOne({token:bearerToken})
        if(blackListedToken){
            return res.redirect('/4_login')
        }

        const decodedData=jwt.verify(bearerToken,config.JWT_ACCESS_SECRET);
        req.user=decodedData
    } catch (error) {
       return res.redirect('/4_login');
    }
    return next()
}

module.exports={
    verifyToken
 }