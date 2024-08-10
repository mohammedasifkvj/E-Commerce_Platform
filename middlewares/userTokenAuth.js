const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // console.log(req.cookies)
    const token = req.cookies.jwtToken

    if (!token) {
        console.log("no token");
       //return res.status(401).json({ message: 'Access Denied: No Token Provided!' });
       return res.status(401).redirect(`/signIn?message=${encodeURIComponent('Access Denied: No Token Provided!')}`);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            console.log("error verification");
            // res.sendStatus(403);
            return res.redirect(`/signIn?message=${encodeURIComponent(' verification error')}`);
        }
        req.user = user;
        next();
    });
};

module.exports={
    authenticateToken
 }
