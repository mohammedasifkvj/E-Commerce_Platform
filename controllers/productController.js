const Product= require("../models/product")
const Category=require("../models/category")
const Cart=require("../models/cart")
const Offer = require("../models/offer")
const Reviews=require("../models/review")
const mongoose = require('mongoose')
const sharp =require('sharp')
const paginate = require('../drivers/paginate');
       
//Admin Product Page Load
const product = async (req, res) => {
    const {message, success} = req.query
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Number of products per page
        // Use the pagination utility function
        const { items: product, totalPages, currentPage } = await paginate(Product, page, limit);
        const category = await Category.find();

        return res.render('5_product', {
            product,
            category,
            currentPage,
            totalPages,
            message, success
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({message:"Internal Server error"})
    }
};

// add product page
const addProductPage =async (req,res)=>{
    const {message, success} = req.query
    try {
        const category=await Category.find()
        return res.render('6_addProduct',{ 
        category,   
        message,
        success
    });
    } catch (e) {
        console.log(e);
    }  
}

// Create new Product
const addProduct = async (req,res) =>{
    const {productName,category,brand,description,dialColour,strapColour,stock,price} = req.body;
    const files=req.files ||{}

    try{

        if(!productName){
            const message='Name is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Name is required')}`);
        }if(!brand){
            const message='Brand is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Brand is required')}`);
        }if(!category){
            const message='category is required'
            return res.status(400).json({message: message})
           // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('category is required')}`);
        }if(! description){
            const message='Description is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Description is required')}`);
        }
        // if(!dialColour){
        //     const message='Dial Colour is required'
        //     return res.status(400).json({message: message})
        //    // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('dialColour is required')}`);
        // }if(!strapColour){
        //     const message='strap Colour is required'
        //     return res.status(400).json({message: message})
        //    // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Strap Colour is required')}`);
        // }
        if(!price){
            const message='Price is required'
            return res.status(400).json({message: message})
           // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Price is required')}`);
        }
        if(!stock){
            const message='Stock is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Stock is required')}`);
          }
  
        const isExist = await Product.findOne({ productName: { $regex: new RegExp(`^${productName}$`, 'i') } });
        if(isExist){
        const message=productName+' product is already exists'
           return res.status(403).json({message: message})
        //    .redirect(`/admin/addProduct?message=${encodeURIComponent(productName+' product is already exists')}`);
        } 

        const newProductExpires = Date.now() + 20*24*60*60*1000;  //20 days
        
        const productImagePaths = [];

        for (let i = 0; i < req.files.length; i++) {
            const imagePaths = `/productImages/${req.files[i].originalname.toLowerCase().replace(/\s+/g, '-')}_thumbnail${i}_${Date.now()}.png`;
            productImagePaths.push(imagePaths);
            await sharp(req.files[i].buffer)
                .png({ quality: 90 })
                .toFile(`public/${imagePaths}`);
        }

        // Check if there's an active offer for this category
    const activeCategoryOffer = await Offer.findOne({ category, status: true });
    let discountPrice = price;  // Default discount price is the original price

    if (activeCategoryOffer) {
      // Calculate discount price based on the offer
      const discountAmount = (price * activeCategoryOffer.discount) / 100;
      const offerDiscount = Math.min(discountAmount, activeCategoryOffer.maxRedeemableAmount);
      discountPrice = price - offerDiscount;
    }

         await Product.create({
            productName,
            category,
            brand,
            description,
            // dialColour,
            // strapColour,
            stock,
            price,
            discountPrice,
            productImage:productImagePaths,
            newProductExpires})
        const message='New product  '+productName+ ' created successfully'
         return res.status(200).json({success:true,message:message})
       // return res.redirect(`/admin/product?success=${encodeURIComponent('New product  '+productName+' created successfully')}`); 
        }catch(e){
        console.log(e);
    }
  }

  //  Edit Product page Load
  const editProductPage =async (req,res)=>{
    const {  productId } = req.params;
    const {message, success} = req.query

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) { 
        return res.redirect(`/admin/product?message=${encodeURIComponent('Product not found')}`);
       }
         const product= await Product.findById(productId)
       if(product=== undefined){
         return res.redirect(`/admin/product?message=${encodeURIComponent('Product not found')}`);
       }

    try {
        const product= await Product.findById(productId);
        const category=await Category.find()
        return res.render('8_editProdectPage',{ 
        product,
        category,   
        message,
        success
    });
    } catch (e) {
        console.log(e.message);
    }  
}

// Edit product
const editProduct = async (req, res) => {
    try {
        const {productName,category,brand,description,
           // dialColour,strapColour,discountPrice
            stock,price} = req.body;
        const files=req.files ||{}
       
         const {productId} = req.params;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) { 
            
            return res.redirect(`/admin/product?message=${encodeURIComponent('Product not found')}`);
           }
             const product= await Product.findById(productId)
           if(product== undefined){
             return res.redirect(`/admin/product?message=${encodeURIComponent('Product not found')}`);
            //return res.status(404).render('404Admin')
           }
        
       //const productData = await Product.findById(productId);
       //console.log(productData);

        if(!productName){
            const message='Name is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Name is required')}`);
        }if(!brand){
            const message='Brand is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Brand is required')}`);
        }if(!category){
            const message='category is required'
            return res.status(400).json({message: message})
           // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('category is required')}`);
        }if(! description){
            const message='Description is required'
            return res.status(400).json({message: message})
            //return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Description is required')}`);
        }
        // if(!dialColour){
        //     const message='Dial Colour is required'
        //     return res.status(400).json({message: message})
        //    // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('dialColour is required')}`);
        // }if(!strapColour){
        //     const message='strap Colour is required'
        //     return res.status(400).json({message: message})
        //    // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Strap Colour is required')}`);
        // }
        if(!price){
            const message='Price is required'
            return res.status(400).json({message: message})
           // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Price is required')}`);
        }
        // if(!discountPrice){
        //     const message='Discount Price is required'
        //     return res.status(400).json({message: message})
        //    // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Discount Price is required')}`);
        // }
        if(!stock){
            const message='Stock is required'
            return res.status(400).json({message: message})
           // return res.redirect(`/admin/addproduct?message=${encodeURIComponent('Stock is required')}`);
         }
        const newProductExpires = Date.now() + 10*24*60*60*1000; 


       //Perform case-insensitive search for existing category
    const isExist =await Product.findOne({ _id:{ $ne: productId },productName:{$regex:new RegExp(`^${productName}$`,'i')}});

    if (isExist) {
        return res.status(402).json({success:false,message:productName+' is already exists'})
        //return res.redirect(`/admin/product?message=${encodeURIComponent(productName+' is already exists')}`);
      }

      // Check if there's an active offer for this category
    const activeCategoryOffer = await Offer.findOne({ category, status: true });
    let discountPrice = price;  // Default discount price is the original price

    if (activeCategoryOffer) {
      // Calculate discount price based on the offer
      const discountAmount = (price * activeCategoryOffer.discount) / 100;
      const offerDiscount = Math.min(discountAmount, activeCategoryOffer.maxRedeemableAmount);
      discountPrice = price - offerDiscount;
    }

         await Product.updateOne({_id:productId},{$set:{
            productName,
            category,
            brand,
            description,
            // dialColour,
            // strapColour,
            stock,
            price,
            discountPrice,
            newProductExpires,
            //productImage:productImagePaths,
        }})

        const message=productName+ ' Updated successfully'
         return res.status(200).json({success:true,message:message})
        //return res.redirect(`/admin/product?success=${encodeURIComponent(productName+' updated successfully')}`); 
        }catch(e){
        console.log(e.message);
       }
  }

  exports.editVariant = async(req,res)=> {

    const {color,prices,stocks} = req.body
    const varinatId = req.query.variantId
    let productId = await productsVariantsCLTN.findOne({_id:varinatId},{productId:1})
    productId = productId.productId
   
 
    if(color){
      const regexPattern = new RegExp(`^${color}$`,'i')
      const checkDuplicate = await productsVariantsCLTN.findOne({productId:productId,color:regexPattern})
   
     
      if(checkDuplicate){
          
           return res.status(CONFLICT).json({success:false,message:"Product variant with the same color already exists. Please choose a different color or update the existing variant."})
      }
 
    }
 
    const updateFields = {}
 
    if(color){
      updateFields.color = color
    }
 
    const allprices = [...prices.split(',').map(x => parseFloat(x))]
    const allstocks = [...stocks.split(',').map(x => parseFloat(x))]
 
    updateFields.prices = allprices 
    updateFields.stocks = allstocks
 
 //    const productImagePaths = []
 
 
    if(req.files.length>0){
      
      let variantImages = await productsVariantsCLTN.findOne({_id:varinatId})
      
 
 
 
      for (const [index, file] of req.files.entries()) {
           const imagePath = `/admin/uploads/products/${file.originalname.toLowerCase().replace(/\s+/g, '-')}_thumbnail${index}_${Date.now()}.png`;
           // productImagePaths.push(imagePath);
       
               await sharp(file.buffer)
               .png({ quality: 90 })
               .toFile(`public/${imagePath}`);
 
            
           variantImages.images[parseInt(file.fieldname)] = imagePath
 
       }
 
       await variantImages.save()
       
    }
 
 
    const editedVariant = await productsVariantsCLTN.findByIdAndUpdate(varinatId,
      {$set:updateFields},
      {new:true}
    )
 
 
    res.status(OK).json({success:true})
 
 }

//List and Unlist Product
const listUnlistProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        
        // Find the product by its ID
        const productData = await Product.findById(productId);
         
        if (!productData) {
            return res.json({ success: false, message: 'Product not found' });
        }

        if (productData.isDeleted) {
            // If the product is already deleted, list the product (set isDeleted to false)
            await Product.findByIdAndUpdate(productId, { $set: { isDeleted: false } }, { new: true });
            return res.json({ success: true, message: 'Product Listed successfully' });
        } else {
            // If the product is not deleted, unlist the product (set isDeleted to true)
            await Product.findByIdAndUpdate(productId, { $set: { isDeleted: true } }, { new: true });

            // Remove the unlisted product from all users' carts
            await Cart.updateMany(
                { "cartItems.productId": productId },
                { $pull: { cartItems: { productId: productId } } }
            );
            return res.json({ success: true, message: 'Product Hided successfully and removed from all carts' });
        }
    } catch (e) {
        console.log(e);
        res.json({ success: false, message: 'An error occurred' });
    }
};

const searchProduct = async (req, res) => {
    const {message, success} = req.query
    try {
        // pagination setting
        const currentPage = parseInt(req.query.page) || 1;
        const productPerPage = 10;
        const skip = (currentPage - 1) * productPerPage;
  
        const totalProduct = await Product.countDocuments();
        const totalPages = Math.ceil(totalProduct / productPerPage);
        // pagination end
  
        let product = [];
        const categoryData = await Category.find();
        const brand = await Product.distinct('brand');
        const allProduct = await Product.find();
  
        if (req.query.searchProduct) {
            product = await Product.find({
                        $or: [
                            { productName: { $regex: req.query.searchProduct, $options: 'i' } },
                            { category: { $regex: req.query.searchProduct } },
                            { brand: { $regex: req.query.searchProduct, $options: 'i' } }
                        ]
            }).skip(skip).limit(productPerPage);
        }
  
        return res.render("5_product", { 
            product: product, 
            category: categoryData, 
            brand: brand, 
            currentPage, 
            totalPages, 
            allProduct,
            message, success
        });
  
    } catch (e) {
        return res.status(500).json({message:`${e.message}`});
    }
  };

//Review Page
const reviews = async(req,res)=>{
    const {message, success} = req.query
    try {
        const page = parseInt(req.query.page) || 1;
        const limit =10; 
        const { items:reviews , totalPages, currentPage } = await paginate(Reviews, page, limit);
        
        const product=await Product.find()
        return res.render('10_reviews',{
        product,
        reviews,
        currentPage,
        totalPages,
        message,success
    });
    } catch (e) {
        return res.status(500).json({message:"Internal Server error"})
    }  
}
//Exporting modules
module.exports={
    product,
    addProductPage,
    addProduct,
    editProductPage,
    editProduct,
    listUnlistProduct,
    searchProduct,
    reviews
}