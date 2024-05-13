const express=require("express");
const admin_route=express();
const adminController=require("../controllers/adminController");

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.get('/',adminController.loadSignin)


module.exports=admin_route;