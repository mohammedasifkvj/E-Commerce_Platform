const express=require("express");
const user_route=express();
const userController=require("../controllers/userController");
const User=require("../models/signup")
const valid=require('../middlewares/validate')
//const session=require("express-session")
//const config=require("../configurarions/config")

//user_route.use(session({secret:config.sessionSecret}))
//const auth=require('../middleware/auth')

user_route.set('view engine','ejs');
user_route.set('views','./views/users');

// const bodyParser=require("body-parser");
// user_route.use(bodyParser.json());
// user_route.use(bodyParser.urlencoded({extended:true}))

// const multer=require("multer");
// const path=require("path");

// const storage=multer.diskStorage(
//   {
//       // destination:function(req,file,cb){
//       //   cb(null,path,join(__dirname,'../public/userImages'));
//       // },
//     filename:function(req,file,cb){
//         const name=Date.now()+'-'+file.originalname;
//         cb(null,name)
//     }
// })
    
// const upload=multer({storage:storage})


// user_route.get('/register',(req,res)=>{
//     res.render('registration')
// })

//user_route.get('/register',auth.isLogout ,userController.loadRegister);
//user_route.post('/register',userController.insertUser);
user_route.get('/',userController.loadHome)
user_route.get('/home',userController.loadHome)
user_route.get('/signup',userController.loadSignUp)
user_route.post('/signup',valid.signUpValidation,userController.SignUp)

//user_route.post('/register',upload.single('image'),userController.insertUser);
user_route.get('/otp',userController.loadOTP)
user_route.get('/signin',userController.loadSignIn)
user_route.get('/forgetPW',userController.forgetPW)
user_route.get('/newRelease',userController.newRel)
user_route.get('/mens',userController.mensPage)
user_route.get('/womens',userController.womensPage)
user_route.get('/cart',userController.loadCart)
user_route.get('/product',userController.product)
user_route.get('/return',userController.retAndShip)
user_route.get('/contact',userController.contactUs)
user_route.get('/brands',userController.brands)

 

module.exports=user_route;