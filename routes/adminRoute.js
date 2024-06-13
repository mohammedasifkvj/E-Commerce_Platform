const express=require("express");
const admin_route=express();
const adminController=require("../controllers/adminController");
const categoryController = require('../controllers/categoryController'); 
const productController = require('../controllers/productController'); 
const auth=require('../middlewares/adminTokenAuth')

// const path = require('path');
// admin_route.set('views',path.join(__dirname,"views"))

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');
//---------------Admin
admin_route.get('/',adminController.loadAdminSignIn)
admin_route.get('/SignIn',adminController.loadAdminSignIn)
admin_route.post('/adminSignIn',adminController.adminSignIn);
admin_route.get('/dash',adminController.loadDash)

//-------------Categry
//admin_route.get('/category',adminController.loadCategory)
admin_route.get('/ShowCategory',categoryController.showCategory)
admin_route.get('/createCat',categoryController.createCat)
admin_route.post('/addCategory',categoryController.createCategory)
admin_route.get('/category',categoryController.editCategoryPage)
admin_route.post('/category',categoryController.editCategory)
//admin_route.post('/category',categoryController.unlistCategory)

//------------Product 
admin_route.get('/product',productController.product)
admin_route.get('/addProduct',productController.addProductPage)
admin_route.post('/addProduct',productController.addProduct)
admin_route.get('/editProductPage',productController.editProductPage)
//admin_route.post('/editProduct',productController.editProduct)
admin_route.patch('/productStatus',productController.listUnlistProduct)


//--------------customer 
admin_route.get('/customerTable',adminController.customerTable)
//admin_route.get('/blockAndUnblockUser', adminController.blockAndUnblockUser)
admin_route.patch('/userStatus', adminController.blockAndUnblockUser);


//--------------Order
//admin_route.get('/orderTable',adminController.orderTable)

//-------------------------------------

module.exports=admin_route;