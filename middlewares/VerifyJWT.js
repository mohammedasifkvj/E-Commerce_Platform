const jwt=require('jsonwebtoken')


const verifyJWT=(req,res,next)=>{
    const authHeader=req.headers['authorization'];
    if(! authHeader) return res.sendStatus(401);
    console.log(authHeader); //Bearer token
    const token =authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET,
        (err,decoded)=>{
            if(err) return res.sendStatus(403); // invalid token
            req.email=decoded.email;
            next()
        }
    );
}

module.exports=verifyJWT