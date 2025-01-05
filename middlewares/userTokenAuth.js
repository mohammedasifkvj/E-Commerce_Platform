const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken');

const authenticateToken = async (req, res, next) => {
    const token = req.cookies.jwtToken;

    if (!token) {
        return res.status(401).redirect(`/signIn?message=${encodeURIComponent('Access Denied: No Token Provided!')}`);
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, user) => {
        if (err) {
            // If access token is expired, check refresh token
            if (err.name === 'TokenExpiredError') {
                const refreshToken = req.cookies.RFToken;
                // console.log("Thsis is RF",refreshToken)

                if (!refreshToken) {
                    return res.status(403).redirect(`/signIn?message=${encodeURIComponent('Refresh Token Missing')}`);
                }

                try {
                    const storedToken = await RefreshToken.findOne({ token: refreshToken });
                    if (!storedToken) {
                        return res.status(403).redirect(`/signIn?message=${encodeURIComponent('Invalid Refresh Token')}`);
                    }

                    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                    const newAccessToken = jwt.sign(
                        { id: decoded.id },
                        process.env.JWT_ACCESS_SECRET,
                        { expiresIn: '4m' }
                    );

                    // Update access token in cookies
                    res.cookie('jwtToken', newAccessToken, { httpOnly: true, secure: true });
                    req.user = decoded;
                    return next();
                } catch (err) {
                    console.log("Refresh token verification error", err);
                    return res.status(403).redirect(`/signIn?message=${encodeURIComponent('Invalid Refresh Token')}`);
                }
            } else {
                return res.status(403).redirect(`/signIn?message=${encodeURIComponent('Token verification error')}`);
            }
        } else {
            req.user = user;
            next();
        }
    });
};

module.exports={
    authenticateToken
 }
