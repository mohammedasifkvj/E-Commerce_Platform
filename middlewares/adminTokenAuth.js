const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // console.log(req.cookies)
    const token = req.cookies.jwtToken

    if (!token) {
        console.log("no token");
        //  res.sendStatus(401);
         return res.redirect(`/admin/SignIn?error=${encodeURIComponent('no token')}`);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            console.log("error verification");
            // res.sendStatus(403);
            return res.redirect(`/admin/SignIn?error=${encodeURIComponent(' verification error')}`);
        }
        req.user = user;
        next();
    });
};

module.exports={
    authenticateToken
 }
