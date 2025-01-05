const jwt = require('jsonwebtoken');

// Format of token
// Authorization:Beareer <access_token>

const authenticateToken = (req, res, next) => {
    // console.log(req.cookies)
    const token = req.cookies.JWTToken

    if (!token) {
        console.log("no token");
        //  res.sendStatus(401);
         return res.redirect(`/admin/login?message=${encodeURIComponent('Access Denied: No Token Provided!')}`);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            console.log(err,"Invalid Token");
            // res.sendStatus(403);
            return res.redirect(`/admin/login?message=${encodeURIComponent(' verification error')}`);
        }
        // Check if the user role is "admin"
        if (user.role !== 'admin') {
            console.log("Access Denied:You is Not an Admin");
            return res.redirect(`/admin/login?message=${encodeURIComponent('Access Denied:You is Not an Admin')}`);
        }

        req.user = user;
        next();
    });
};

module.exports={
    authenticateToken
 }
