const jwt = require('jsonwebtoken');
//const keys = require('../config/keys');
const {User} = require('../models/signup');

module.exports = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    jwt.verify(token,process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized: Invalid token');
        }

        req.user = await User.findById(decoded.id);
        next();
    });
};
