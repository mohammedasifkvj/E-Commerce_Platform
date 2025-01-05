//Models
const Category = require('../models/category')
const Product = require('../models/product');
const Review = require("../models/review")

const mongoose = require('mongoose')

// To load New Release Page
const newRel = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of products per page
        const skip = (page - 1) * limit;

        // Get the current date for checking offer expiry
        const currentDate = new Date();

        const product = await Product.find({
            isDeleted: false,
            newProductExpires: { $gt: Date.now() }
        })
            .populate({
                path: 'offer',  // Populate the offer field
                match: { status: true, expDate: { $gte: currentDate } }  // Only match offers that are active and not expired
            })
            .skip(skip)
            .limit(limit);

        // Count total products for pagination
        const totalProduct = await Product.countDocuments({ isDeleted: false, newProductExpires: { $gt: Date.now() } });
        const totalPages = Math.ceil(totalProduct / limit);

        return res.render('7_newRelease', {
            product,
            currentPage: page,
            totalPages
        });
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error');
    }
};

// const newRel = async (req, res) => {
//   try { 
//      const page = parseInt(req.query.page) || 1;
//         const limit = 12; // Number of offers per page
//         const skip = (page - 1) * limit;

//       const product= await Product.find({isDeleted:false, 
//          newProductExpires :{$gt:Date.now()}
//         }).skip(skip).limit(limit);
//       return res.render('7_newRelease', { product});
//   } catch (e) {
//       console.log(e.message);
//   }
// };

// To load Mens Page 
// const mensPage = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//         const limit = 12; // Number of Product per page
//         const skip = (page - 1) * limit;


//    // const category=await Category.find({isDeleted:false})
//       const product= await Product.find({category:"Mens" ,isDeleted:false }).skip(skip).limit(limit);
//       const totalProduct = await Product.countDocuments()
//       const totalPages = Math.ceil(totalProduct/limit);

//       return res.render('8_mens', { 
//         product,
//         currentPage: page,
//         totalPages
//       });
//   } catch (e) {
//       console.log(e.message);
//   }
// };

const mensPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of products per page
        const skip = (page - 1) * limit;

        // Get the current date for checking offer expiry
        const currentDate = new Date();

        // Fetch products for Men's category that are not deleted, 
        //and populate only offers that are active and not expired
        const product = await Product.find({
            category: "Mens",
            isDeleted: false
        })
            .populate({
                path: 'offer',  // Populate the offer field
                match: { status: true, expDate: { $gte: currentDate } }  // Only match offers that are active and not expired
            })
            .skip(skip)
            .limit(limit);

        // Count total products for pagination
        const totalProduct = await Product.countDocuments({ category: "Mens", isDeleted: false });
        const totalPages = Math.ceil(totalProduct / limit);

        return res.render('8_mens', {
            product,
            currentPage: page,
            totalPages
        });
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error');
    }
};


const womensPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // Number of products per page
        const skip = (page - 1) * limit;

        // Get the current date for checking offer expiry
        const currentDate = new Date();

        // Fetch products for Men's category that are not deleted, 
        // and populate only offers that are active and not expired
        const product = await Product.find({
            category: "Womens",
            isDeleted: false
        })
            .populate({
                path: 'offer',  // Populate the offer field
                match: { status: true, expDate: { $gte: currentDate } }  // Only match offers that are active and not expired
            })
            .skip(skip)
            .limit(limit);

        // Count total products for pagination
        const totalProduct = await Product.countDocuments({ category: "Womens", isDeleted: false });
        const totalPages = Math.ceil(totalProduct / limit);

        return res.render('9_womens', {
            product,
            currentPage: page,
            totalPages
        });
    } catch (e) {
        console.log(e.message);
        res.status(500).send('Server Error');
    }
};

// // To load Womens Page
// const womensPage = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//         const limit = 12; // Number of offers per page
//         const skip = (page - 1) * limit;

//   try {
//       const product= await Product.find({ category:"Womens",isDeleted:false }).skip(skip).limit(limit);
//       const totalProduct = await Product.countDocuments()
//       const totalPages = Math.ceil(totalProduct/limit);
//       return res.render('9_womens', { 
//         product,
//         currentPage: page,
//         totalPages
//       });
//   } catch (e) {
//       console.log(e.message);
//   }
// };



// To load Product Page

const productShow = async (req, res) => {
    try {
        const { productId } = req.params;
        //console.log("id",productId);
        // Validate productId
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(404).render('404User')
        }
        const product = await Product.findById(productId);
        if (product == undefined) {
            return res.status(404).render('404User')
        }
        // Find related products in the same category, excluding the current product
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId }
        }).limit(6);

        return res.render('Details page', {
            product,
            relatedProducts
        });
    } catch (e) {
        console.log(e.message);
    }
}
//   { productId: '668b854eb06d955923231980' }
// 668b854eb06d955923231980
// { productId: 'undefined' }
// undefined
// Cast to ObjectId failed for value "undefined" (type string) at path "_id" for model "Product"

// Review of the product
const postReview = async (req, res) => {
    const { productId } = req.params;
    const { rating, name, productName, comments } = req.body
    try {
        const review = new Review({
            productId,
            rating,
            name,
            productName,
            comments
        })
        await review.save();
        return res.status(200).json({ message: 'Thanks for your review' });
    } catch (e) {
        console.log(e);
    }
}


// To load Brands Page
const brands = async (req, res) => {
    try {
        res.render('brands');
    } catch (e) {
        console.log(e.message);
    }
}

// To load Return and Shipping Page
const retAndShip = async (req, res) => {
    try {
        return res.render('return_ship');
    } catch (e) {
        console.log(e.message);
    }
}

// To load Contact Us Page
const contactUs = async (req, res) => {
    try {
        return res.render('contact_us');
    } catch (e) {
        console.log(e.message);
    }
}

// search Product 
const searchProduct = async (req, res) => {
    try {
        // pagination setting
        const currentPage = parseInt(req.query.page) || 1;
        const productPerPage = 28;
        const skip = (currentPage - 1) * productPerPage;

        const totalProduct = await Product.countDocuments();
        const totalPages = Math.ceil(totalProduct / productPerPage);
        // pagination end

        let productData = [];
        const categoryData = await Category.find({ isDeleted: false });
        const Brand = await Product.distinct('brand');
        const allProduct = await Product.find({ isDeleted: false });

        let origin = req.query.origin // Default to home if no origin is specified
        console.log(origin);
        if (req.query.search_query) {
            productData = await Product.find({
                $and: [
                    { isDeleted: false },
                    {
                        $or: [
                            { productName: { $regex: req.query.search_query, $options: 'i' } },
                            { category: { $regex: req.query.search_query, $options: 'i' } },
                            { brand: { $regex: req.query.search_query, $options: 'i' } }
                        ]
                    }
                ]
            }).skip(skip).limit(productPerPage);
        }

        let template;
        switch (origin) {
            case 'mens':
                template = '8_mens';
                break;
            case 'womens':
                template = '9_womens';
                break;
            case 'newRel':
                template = '7_newRelease';
                break;
            default:
                template = '1_home';
        }

        return res.render(template, {
            //user: userData, 
            product: productData,
            category: categoryData,
            brand: Brand,
            currentPage,
            totalPages,
            allProduct
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    newRel,
    mensPage,
    womensPage,
    productShow,
    postReview,
    searchProduct,
    retAndShip,
    contactUs,
    brands
}