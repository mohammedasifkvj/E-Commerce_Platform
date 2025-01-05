// Format of token
// Authorization:Beareer <access_token>

// // to verify Login
// const verifyToken=(req,res,next)=>{
//     let authHeader=req.headers.authorization;
//     if(authHeader==undefined){
//         res.status(401).send({error:'No token provided'})
//     }
//     let token=authHeader.split(" ")[1]
//     jwt.verify(token,"tokenSecret",(err,decoded)=>{
//         if(err){
//             res.status(500).send({error:'Authontication failed'})
//         }else{
//             res.send(decoded)
//         }
//     })
// }

// to verify Login
const  verifyToken=(req,res,next)=>{
    //get auth header value
    const bearerHeader=req.headers['authorization'];
    //check if the bearer is undefined
    if(typeof bearerHeader !=='undefined'){
        //split at the space
        const bearer=bearerHeader.split('');
        //get token from array
        const bearerToken=bearer[1];
        //set the token
        req.token=bearerToken
        next()
    }else{
        // forbidden
        res.sendStatus(403)
    }
}

module.exports={
    verifyToken
 }