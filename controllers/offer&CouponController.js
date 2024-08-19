const Category = require('../models/category');
const Product = require('../models/product');
const Offer = require('../models/offer');
const Coupon = require('../models/coupon');
const mongoose = require('mongoose')

//Admin Offer Page Load
const offers = async(req,res)=>{
    const {message, success} = req.query
    try {
        const page = parseInt(req.query.page) || 1;
        const limit =10; // Number of offers per page
        const skip = (page - 1) * limit;

        const totalOffers = await Offer.countDocuments();
        const offer = await Offer.find().skip(skip).limit(limit);
        const totalPages = Math.ceil(totalOffers / limit);
        const category=await Category.find()

        return res.render('11_offers',{
        offer,
        category,
        currentPage: page,
        totalPages, 
        message,
        success
    });
    } catch (e) {
        console.log(e);
    }  
}

// add offer page
const addOfferPage =async (req,res)=>{
    try {
        const category=await Category.find()
        const product=await Product.find()
        return res.render('11_addOffer',{ 
        category,
        product
    });
    } catch (e) {
        console.log(e);
    }  
}

// Add offer
const addOffer = async (req, res, next) => {
    console.log(req.body)
    try {
        const { offerName, type,  category,productName, expDate, discount,maxRedeemableAmount } = req.body;

        // Validate input
        if (!offerName || offerName.trim() === '') {
            return res.status(403).json({ message: "Enter Proper Offer Details" });
        } else if (!type) {
            return res.status(403).json({ message: "Please select an offer Type" });
        } else if (!expDate || discount === undefined || maxRedeemableAmount === undefined) {
            return res.status(403).json({ message: "Must provide ExpiredDate, discount, and maximum Redeemable Amount" });
        }

        // Check for duplicate offer (case insensitive)
        const isOfferExist = await Offer.findOne({ offerName: { $regex: new RegExp(`^${offerName}$`, 'i') } });
        if (isOfferExist) {
            return res.status(403).json({ message: "This offer name already exists, please enter another name for Offer" });
        }

        const newOffer = new Offer({
            offerName,
            type,
            expDate,
            discount,
            maxRedeemableAmount,
            category: type === 'Category Offer' ? category : undefined,
            productName: type === 'Product Offer' ? productName: undefined
        });

        await newOffer.save();

        const offerId = newOffer._id;

        if (type === 'Product Offer') {
            // Update a specific product
            await Product.updateOne(
                { productName: productName },
                { 
                    $addToSet: { offer: offerId }
                }
            );
        } else if (type === 'Category Offer') {
            const categoryDoc = await Category.findOne({ name: category });
            if (!categoryDoc) {
                return res.status(404).json({ message: "Category not found" });
            }

            await Product.updateMany(
                { category: categoryDoc.name },
                { 
                    $addToSet: { offer: offerId }
                }
            );
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

// Offer status change 
const offerStatusChange = async (req,res) => {
    try {
        const { offerId, status } = req.query;
        const newStatus = status === 'true';

        const offer = await Offer.findById(offerId);
        if (offer) {
            offer.status = newStatus;
            await offer.save();

            if (offer.type === 'Product Offer') {
                if (newStatus) {
                    // Activate: Add offer ID to the offers array in the product
                    await Product.updateOne(
                        { productName: offer.productName },
                        { $addToSet: { offers: offerId } } // Add offer ID if not already present
                    );
                } else {
                    // Deactivate: Remove offer ID from the offers array in the product
                    await Product.updateOne(
                        { productName: offer.productName },
                        { $pull: { offers: offerId } } // Remove offer ID
                    );
                }
            } else if (offer.type === 'Category Offer') {
                // Find the category by name to get its ObjectId
                const categoryDoc = await Category.findOne({ name: offer.category });
                if (!categoryDoc) {
                    return res.status(404).json({ message: "Category not found" });
                }

                if (newStatus) {
                    // Activate: Add offer ID to the offers array in all products of the category
                    await Product.updateMany(
                        { category: categoryDoc.name },
                        { $addToSet: { offers: offerId } } // Add offer ID if not already present
                    );
                } else {
                    // Deactivate: Remove offer ID from the offers array in all products of the category
                    await Product.updateMany(
                        { category: categoryDoc.name },
                        { $pull: { offers: offerId } } // Remove offer ID
                    );
                }
            }

            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Offer not found' });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Coupon Table
const coupon = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.page) || 1 ;
        const couponPerPage = 10
        const skip = (currentPage - 1) * couponPerPage;

        const coupon = await Coupon.find().skip(skip).limit(couponPerPage).sort({createdDate:-1});

        const totalProduct = await Coupon.countDocuments()
        const totalPages = Math.ceil(totalProduct / couponPerPage)

        return res.render('12_coupon', { coupon , currentPage, totalPages })
    } catch (error) {
        console.log(error.message);
    }
}


const addCouponPage = async (req, res) => {
    try {
       return res.render('12_addCoupon')
    } catch (error) {
        console.log(error.message);
    }
}


// Add Coupon
const addCoupon = async (req, res) => {
    try {
        const { couponCode, discountPercentage, expiredDate, minPurchaseAmt, maxRedimabelAmount } = req.body;

        if (!couponCode || couponCode.trim() === "") {
            return res.status(400).json({ message: "Coupon Code is required and cannot be empty" });
        }

    const isExist = await Coupon.findOne({ couponCode: { $regex: new RegExp(`^${couponCode}$`, 'i') } });
      if (isExist) {
        return res.status(403).json({ message: "This Coupon Code already exists, please enter another one" });
      }

        const coupon = new Coupon({
            couponCode,
            discountPercentage: Number(discountPercentage),
            expiredDate: new Date(expiredDate),
            minPurchaseAmt: Number(minPurchaseAmt),
            maxRedimabelAmount: Number(maxRedimabelAmount),
        });

        try {
            await coupon.save();
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Database save error:', error);
            if (error.code === 11000) { // Duplicate key error code
                return res.status(403).json({ message: "This Coupon Code already exists, please enter another one" });
            }
            throw error;
        }

    } catch (e) {
        console.error('Internal error:', e.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


//Activate and Deactivate
const couponStatusChange = async (req, res, next) => {
    try {
        const id = req.query.couponId;
        if (!id) {
            return res.status(400).json({ success: false, message: "Invalid input: Coupon ID is required" });
        }
        
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        
        coupon.status = !coupon.status;
        await coupon.save();

        let message = coupon.status ? "Coupon Activated successfully" : "Coupon Inactivated successfully";
        res.status(200).json({ success: true, message });

    } catch (error) {
        console.log(error.message);
        next(error);
    }
};


const applyCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;
        //console.log(req.body)
        // Example validation or checking before processing
        if (!couponCode) {
            console.log("1");
            
            return res.status(401).json({ message: "Coupon code is required." });
        }
        
        // Example: Fetch coupon data from database
        const coupon = await Coupon.findOne({ couponCode: couponCode });

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }
        if (coupon.minPurchaseAmt > totalAmount) {
            return res.status(408).json({ message: `Insufficiant Purchase amount , ${coupon.minPurchaseAmt} is requered` });
        }

        if (coupon.status===false) {
            return res.status(400).json({ message: `This coupon is Blocked ,You Can't Add This` });
        }

        // Example: Check if coupon is applicable based on conditions
        if (coupon.minPurchaseAmt > totalAmount) {
            return res.status(400).json({ message: `This coupon is only valid for Purchases Over ${coupon.minPurchaseAmt}` });
        }

        // Example: Calculate discount or apply coupon logic
        const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
        const couponDiscount = Math.min(discountAmount, coupon.maxRedimabelAmount);
        const grandTotal=totalAmount - couponDiscount

        return res.status(200).json({ success: true, discount: couponDiscount,grandTotal:grandTotal });
    } catch (error) {
        console.error('Error applying coupon:', error);
        return res.status(500).json({ message: 'An error occurred while applying the coupon.' });
    }
};



const removeCoupon = async (req, res) => {
    try {
        if (req.session.coupon) {
            delete req.session.coupon; // Remove coupon from session
        }
        return res.status(200).json({ success: true, message: 'Coupon removed successfully' });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'An error occurred while removing the coupon' });
    }
};

// const applyCoupon = async (req, res, next) => {
//     try {
//         const { couponCode, totalAmount } = req.body
//         const data = await Coupon.findOne({ status: true, couponCode: couponCode })

//         if (data !== null && data.minPurchaseAmt > totalAmount) {
//             res.status(400).json({ message: `This coupon is only valid for Purchases Over ${data.minPurchaseAmt}` })
//         } else if (data !== null) {
//             req.session.coupon = data.discountPercentage;
//             req.session.couponId = data._id
//             res.status(200).json({ success: true, discount: data.discountPercentage })
//         } else {
//             res.status(400).json({ message: "coupon code is incorrect!" })
//         }
//     } catch (error) {
//         console.log(error.message);
//         next(error)
//     }
// }


module.exports={
//offer
    offers,
    addOfferPage,
    addOffer,
    offerStatusChange,
// Coupon
    coupon, 
    addCouponPage,
    addCoupon,
    couponStatusChange,
    applyCoupon,
    removeCoupon
}

