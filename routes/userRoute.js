const express=require("express");
const user_route=express();
const auth=require('../middlewares/userTokenAuth')

const userController=require("../controllers/userController");
//const {signUpValidation,signInValidation}=require("../validators/signUpValidation")

// const auth=require('../middlewares/auth')
// const auth=require('../middlewares/validateToken')
// const path = require('path');
// user_route.set('views',path.join(__dirname,"views"))

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());

const multer=require('multer');

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images'));
    },
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname;
        cb(null,name)
    }
});
const upload=multer({storage:storage})
//const session=require("express-session")
//const config=require("../configurarions/config")

//user_route.use(session({secret:config.sessionSecret}))

// const bodyParser=require("body-parser");
// user_route.use(bodyParser.json());
// user_route.use(bodyParser.urlencoded({extended:true}))

user_route.get('/',userController.loadHome)
user_route.get('/home',userController.loadHome)
user_route.get('/signUp',userController.loadSignUp)

user_route.post('/send-otp',userController.requestOtp)
//user_route.get('/otp',userController.loadOTP)
//user_route.post('/signUp',upload.single('image'),signUpValidation,userController.signUp);
user_route.post('/verifyOTP',userController.verifyOtp)
//user_route.get('/googleVerify',userController.googleVerify)
user_route.get('/otp',userController.loadOTP)
user_route.get('/signIn',userController.loadSignIn)

user_route.post('/signIn',auth.authenticateToken,userController.verifySignIn)
// user_route.post('/signIn',auth.verifyToken,userController.signIn)

user_route.get('/forgetPW',userController.forgetPW)
user_route.get('/newRelease',userController.newRel)
user_route.get('/mens',userController.mensPage)
user_route.get('/womens',userController.womensPage)
user_route.get('/cart',userController.loadCart)
user_route.get('/product',userController.productShow)
user_route.get('/return',userController.retAndShip)
user_route.get('/contact',userController.contactUs)
user_route.get('/brands',userController.brands)



//user_route.get('/logout',auth.verifyToken,userController.logout)

module.exports=user_route;