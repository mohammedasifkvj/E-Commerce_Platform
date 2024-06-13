const Product= require("../models/product")
const Category=require("../models/category")

// Product Page Load
const product = async(req,res)=>{
    const {error, success} = req.query
    try {
        const product= await Product.find()
        res.render('5_product',{
        product,    
        error,
        success
    });
    } catch (e) {
        console.log(e);
    }  
}

// add product
const addProductPage =async (req,res)=>{
    const {error, success} = req.query
    try {
        const category=await Category.find()
        res.render('6_addProduct',{ 
        category,   
        error,
        success
    });
    } catch (e) {
        console.log(e);
    }  
}

// Create new Category
const addProduct = async (req,res) =>{
    const {productName,category,brand,description,price,discountPrice,stock} = req.body;
    try{
        if(!productName)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Name is required')}`);
        if(!category)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('category is required')}`);
        if(!brand)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Brand is required')}`);
        if(! description)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Description is required')}`);
        if(!price)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Price is required')}`);
        if(!discountPrice)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Discount Price is required')}`);
        if(!stock)
            return res.redirect(`/admin/addproduct?error=${encodeURIComponent('Stock is required')}`);
  
        const isExist = await Product.findOne({productName});
        if(isExist){
           return res.redirect(`/admin/addProduct?error=${encodeURIComponent(productName+' product is already exists')}`);
        } 
         await Product.create({productName,category,brand,description,price,discountPrice,stock})
  
        return res.redirect(`/admin/product?success=${encodeURIComponent('New product  '+productName+ ' created successfully')}`); 
        }catch(e){
        console.log(e);
    }
  }

  // Product Edit page Load
  const editProductPage =async (req,res)=>{
    const { productName  } = req.params;
    const {error, success} = req.query
    try {
        let product= await Product.findOne({pid:productName });
        res.render('8_editProdectPage',{ 
        product,   
        error,
        success
    });
    } catch (e) {
        console.log(e);
    }  
}

// Edit product



//List and Unlist Product
const listUnlistProduct = async (req, res) => {
    //console.log("work")
    try {
        const { productId } = req.body;
       // console.log(productId, 'this is productId');
        const productData = await Product.findById(productId);
        
        if (!productData) {
          return res.json({ success: false, message: 'Product not found' });
        }
  
       if (productData.isDeleted) {
        await Product.findByIdAndUpdate(productId, { $set: { isDeleted: false } }, { new: true });
        return res.json({ success: true, message: 'Product Listed successfully' });
       } else {
        await Product.findByIdAndUpdate(productId, { $set: { isDeleted: true } }, { new: true });
        return res.json({ success: true, message: 'Product Hided successfully' });
       }
       
    } catch (e) {
        console.log(e.message);
        res.json({ success: false, message: 'An error occurred' });
    }
  };
module.exports={
    product,
    addProductPage,
    addProduct,
    editProductPage,
    listUnlistProduct
}