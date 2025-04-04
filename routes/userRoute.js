const express = require("express");
const user_route = express();
const passport = require('passport')
const auth = require('../middlewares/userTokenAuth')
const logged = require('../middlewares/hasToken')
const userController = require("../controllers/userController");
const pageController = require("../controllers/pageController");
const authMiddleware = require('../middlewares/authMiddleware')
const cartController = require('../controllers/cart&WishController')
const orderController = require('../controllers/orderController')
const accountController = require('../controllers/accountController')
const offerController = require('../controllers/offer&CouponController')
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');


user_route.use(methodOverride('_method'));

user_route.set('views', './views/users');

user_route.use(express.json());
user_route.use(cookieParser());

user_route.use(passport.initialize());

user_route.get('/', userController.loadHome)
user_route.get('/home', userController.loadHome)
// sign Up
user_route.get('/signUp', logged.isLoggedIn, userController.loadSignUp)
user_route.post('/send-otp', userController.requestOtp)
user_route.get('/otp', logged.isLoggedIn, userController.loadOTP)
user_route.post('/resendOTP',userController.resendOTP)
user_route.post('/verifyOTP', userController.verifyOtp)

// Sign In
user_route.get('/signIn', logged.isLoggedIn, userController.loadSignIn)
user_route.post('/signIn', userController.verifySignIn)
// Google SSO
user_route.get('/googleSSO', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false // Disable session
}));

user_route.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/signIn' }), userController.googleAuth);

user_route.get('/signOut', auth.authenticateToken, userController.logout)
user_route.get('/forgetPW', logged.isLoggedIn, userController.forgetPW)
user_route.post('/reset', userController.resetPWOTP)
user_route.get('/resetOTP', userController.loadresetOTP)
user_route.post('/verifyResetOTP', userController.resetPasswordPage)
user_route.post('/resetPassword', userController.resetPassword)

// Pages
user_route.get('/newRelease', pageController.newRel)
user_route.get('/mens', pageController.mensPage)
user_route.get('/womens', pageController.womensPage)
user_route.get('/product/:productId', pageController.productShow)
user_route.post('/product/review/:productId', pageController.postReview)

user_route.get('/searchProduct', pageController.searchProduct)
user_route.get('/return', pageController.retAndShip)
user_route.get('/contact', pageController.contactUs)
user_route.get('/brands', pageController.brands)

//-----------------------------User Account---------------------------------//
user_route.get('/account', auth.authenticateToken, accountController.profile)
user_route.get('/account/profileSettings', auth.authenticateToken, accountController.profileSettings)
user_route.post('/account/changePassword', auth.authenticateToken, accountController.changePassword)
//Address
user_route.get('/address', auth.authenticateToken, accountController.address)
user_route.get('/addAddress', auth.authenticateToken, accountController.addAddressPage)
user_route.post('/addAddress', auth.authenticateToken, accountController.addAddress)
user_route.get('/editAddress', auth.authenticateToken, accountController.editAddressPage) //address id passed as query
user_route.put('/editAddress/:addressId', auth.authenticateToken, accountController.editAddress)//addressId passed as params
user_route.delete('/deleteAddress', auth.authenticateToken, accountController.deleteAddress)
//WishList
user_route.get('/wishlist', auth.authenticateToken, accountController.wishlist)
user_route.post('/addProductToWishlist', auth.authenticateToken, cartController.addToWishlist)
user_route.delete('/removeProduct', auth.authenticateToken, cartController.removeProduct)

//Oredr
user_route.get('/orders', auth.authenticateToken, accountController.orders)
user_route.get('/orderDetails/:orderId', auth.authenticateToken, accountController.orderDetails)
user_route.get('/cancelOrder',auth.authenticateToken,accountController.cancellOrder);
user_route.post('/returnOrder',auth.authenticateToken,accountController.requestForReturn);
user_route.get('/wallet', auth.authenticateToken, accountController.wallet)
//-------------------------------------------------------------------------------//

// cart
user_route.post('/addProductToCart', auth.authenticateToken, cartController.addToCart)
user_route.get('/cart', auth.authenticateToken, cartController.loadCart)
user_route.post('/cart/changeQuantity', auth.authenticateToken, cartController.changeQuantity)
// user_route.post('/increaseQty', auth.authenticateToken, cartController.increaseQuantity)
// user_route.post('/decreaseQty', auth.authenticateToken, cartController.decreaseQuantity)
user_route.delete('/deleteProduct', auth.authenticateToken, cartController.deleteProduct)
user_route.delete('/clearCart', auth.authenticateToken, cartController.clearCart)

//Coupon
user_route.post('/applyCoupon', auth.authenticateToken, offerController.applyCoupon)

//Create Order
user_route.post('/stockCheck', auth.authenticateToken, orderController.stockCheck)
user_route.get('/checkout', auth.authenticateToken, orderController.checkoutPage)
user_route.post('/makeOrder', auth.authenticateToken, orderController.makeOrder)
user_route.post('/createPaypalOrder', auth.authenticateToken, orderController.payPalPay);
user_route.get('/captureOrder',auth.authenticateToken, orderController.captureOrder);
user_route.get('/orderConfirmation/:orderId',auth.authenticateToken, orderController.oredrConfirmation)
user_route.get('/invoiceDownload/:orderId',auth.authenticateToken,orderController.invoiceDownload);


module.exports = user_route;