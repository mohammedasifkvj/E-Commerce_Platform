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
const addOffer = async (req, res) => {
    try {
        const { offerName, type, category, productName, expDate, discount, maxRedeemableAmount } = req.body;

        // Validate input
        if (!offerName || offerName.trim() === '') {
            return res.status(403).json({ message: "Enter Proper Offer Details" });
        } else if (!type) {
            return res.status(403).json({ message: "Please select an offer Type" });
        } else if (!expDate || discount === undefined || maxRedeemableAmount === undefined) {
            return res.status(403).json({ message: "Must provide Expiration Date, discount, and maximum Redeemable Amount" });
        }

        // Check for duplicate offer
        const isOfferExist = await Offer.findOne({ offerName: { $regex: new RegExp(`^${offerName}$`, 'i') } });
        if (isOfferExist) {
            return res.status(403).json({ message: "This offer name already exists, please enter another name for Offer" });
        }

        // Create a new offer
        const newOffer = new Offer({
            offerName,
            type,
            expDate,
            discount,
            maxRedeemableAmount,
            category: type === 'Category Offer' ? category : undefined,
            productName: type === 'Product Offer' ? productName : undefined
        });

        await newOffer.save();

        const offerId = newOffer._id;

        if (type === 'Product Offer') {
            // Fetch the product to update its discount price
            const product = await Product.findOne({ productName: productName });
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            // Calculate the discount price
            const discountAmount = (product.price * discount) / 100;
            const offerDiscount = Math.min(discountAmount, maxRedeemableAmount);

            // Set discount price and update offer array
            product.discountPrice = product.price - offerDiscount;
            product.offer.push(offerId);
            await product.save();

        } else if (type === 'Category Offer') {
            const categoryDoc = await Category.findOne({ name: category });
            if (!categoryDoc) {
                return res.status(404).json({ message: "Category not found" });
            }

            // Fetch products in the category and update their discount prices
            const products = await Product.find({ category: categoryDoc.name });
            for (const product of products) {
                const discountAmount = (product.price * discount) / 100;
                const offerDiscount = Math.min(discountAmount, maxRedeemableAmount);

                // Set discount price and update offer array
                product.discountPrice = product.price - offerDiscount;
                product.offer.push(offerId);
                await product.save();
            }
        }

        return res.status(201).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
};

const offerDatails=async (req, res) => {
  const offer = await Offer.findById(req.params.offerId);
  //console.log("qwe",offer)
  try {
    let products = [];
  if (offer.type === 'Product Offer') {
      products = await Product.find({ productName: { $in:[offer.productName ] } });
  } else if (offer.type === 'Category Offer') {
      products = await Product.find({ category: offer.category });
  }
  return res.json({ offer, products });
  } catch (error) {
    console.log(error)
  }
}

//Offer status change
const offerStatusChange = async (req, res) => {
    try {
      const { offerId, status } = req.query;
      const newStatus = status === 'true';
  
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.json({ success: false, message: 'Offer not found' });
      }
  
      // Check if the offer is expired
      const now = new Date();
      if (newStatus && offer.expDate < now) {
        return res.json({ success: false, message: 'This offer has expired and it cannot be activated.' });
      }
  
      // Update offer status
      offer.status = newStatus;
      await offer.save();
  
      if (offer.type === 'Product Offer') {
        // Find the product related to this offer
        const product = await Product.findOne({ productName: offer.productName });
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
  
        if (newStatus) {
          // Activate: Calculate and apply the discount price
          const discountAmount = (product.price * offer.discount) / 100;
          const offerDiscount = Math.min(discountAmount, offer.maxRedeemableAmount);
  
          // Update the product's discount price and add the offerId
          await Product.updateOne(
            { _id: product._id },
            {
              discountPrice: product.price - offerDiscount,
              $push: { offer: offerId }
            }
          );
        } else {
          // Deactivate: Reset the discount price to original price and remove the offerId
          await Product.updateOne(
            { _id: product._id },
            {
              discountPrice: product.price,
              $pull: { offer: offerId }
            }
          );
  
          // Check if there's any active category offer for this product
          const activeCategoryOffer = await Offer.findOne({ category: product.category, status: true });
          if (activeCategoryOffer) {
            // Apply the category offer discount
            const discountAmount = (product.price * activeCategoryOffer.discount) / 100;
            const offerDiscount = Math.min(discountAmount, activeCategoryOffer.maxRedeemableAmount);
  
            await Product.updateOne(
              { _id: product._id },
              {
                discountPrice: product.price - offerDiscount,
                $push: { offer: activeCategoryOffer._id }
              }
            );
          }
        }
      } else if (offer.type === 'Category Offer') {
        // Find all products in the offer's category
        const products = await Product.find({ category: offer.category });
  
        for (let product of products) {
          if (newStatus) {
            // Activate: Calculate and apply the discount price
            const discountAmount = (product.price * offer.discount) / 100;
            const offerDiscount = Math.min(discountAmount, offer.maxRedeemableAmount);
  
            await Product.updateOne(
              { _id: product._id },
              {
                discountPrice: product.price - offerDiscount,
                $push: { offer: offerId }
              }
            );
          } else {
            // Deactivate: Reset the discount price to original price and remove offerId
            await Product.updateOne(
              { _id: product._id },
              {
                discountPrice: product.price,
                $pull: { offer: offerId }
              }
            );
  
            // Check if there's any active product-specific offer for this product
            const activeProductOffer = await Offer.findOne({ _id: { $in: product.offer }, status: true });
            if (activeProductOffer) {
              // Apply the product-specific offer discount
              const discountAmount = (product.price * activeProductOffer.discount) / 100;
              const offerDiscount = Math.min(discountAmount, activeProductOffer.maxRedeemableAmount);
  
              await Product.updateOne(
                { _id: product._id },
                {
                  discountPrice: product.price - offerDiscount,
                  $push: { offer: activeProductOffer._id }
                }
              );
            }
          }
        }
      }
  
      return res.json({ success: true });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  };

//Delete offer
const deleteOffer= async (req, res) => {
  const { offerId } = req.body

  if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
    return res.status(404).redirect(`/admin/offer?message=${encodeURIComponent('Invalid offer ID')}`);
  }
  const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.json({ success: false, message: 'Offer not found' });
      }
  try {
    if (offer.type === 'Product Offer') {
      // Find the product related to this offer
      const product = await Product.findOne({ productName: offer.productName });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
        // Deactivate: Reset the discount price to original price and remove the offerId
        await Product.updateOne(
          { _id: product._id },
          {
            discountPrice: product.price,
            $pull: { offer: offerId }
          }
        );

        // Check if there's any active category offer for this product
        const activeCategoryOffer = await Offer.findOne({ category: product.category, status: true });
        if (activeCategoryOffer) {
          // Apply the category offer discount
          const discountAmount = (product.price * activeCategoryOffer.discount) / 100;
          const offerDiscount = Math.min(discountAmount, activeCategoryOffer.maxRedeemableAmount);

          await Product.updateOne(
            { _id: product._id },
            {
              discountPrice: product.price - offerDiscount,
              $push: { offer: activeCategoryOffer._id }
            }
          );
        }
        await Offer.deleteOne({ _id: offerId });
    } else if (offer.type === 'Category Offer') {
      // Find all products in the offer's category
      const products = await Product.find({ category: offer.category });

      await Offer.deleteOne({ _id: offerId });

      for (let product of products) {
          // Deactivate: Reset the discount price to original price and remove offerId
          await Product.updateOne(
            { _id: product._id },
            {
              discountPrice: product.price,
              $pull: { offer: offerId }
            }
          );

          // Check if there's any active product-specific offer for this product
          const activeProductOffer = await Offer.findOne({ _id: { $in: product.offer }, status: true });
          if (activeProductOffer) {
            // Apply the product-specific offer discount
            const discountAmount = (product.price * activeProductOffer.discount) / 100;
            const offerDiscount = Math.min(discountAmount, activeProductOffer.maxRedeemableAmount);

            await Product.updateOne(
              { _id: product._id },
              {
                discountPrice: product.price - offerDiscount,
                $push: { offer: activeProductOffer._id }
              }
            );
          }
      }
    }

    return res.status(200).json({ message: "Offer deleted Successfully" })
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: `error in deleting offer ${e}` })
  }
}

// Coupon Table
const coupon = async (req, res) => {
    const {message, success} = req.query
    try {
        const currentPage = parseInt(req.query.page) || 1 ;
        const couponPerPage = 10
        const skip = (currentPage - 1) * couponPerPage;

        const coupon = await Coupon.find().skip(skip).limit(couponPerPage).sort({createdDate:-1});

        const totalProduct = await Coupon.countDocuments()
        const totalPages = Math.ceil(totalProduct / couponPerPage)

        return res.render('12_coupon', { 
            coupon ,
            currentPage,
            totalPages,
            message, success
         })
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


//Activate and Deactivate Coupon
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

//Delete Coupon
const deleteCoupon = async (req, res) => {
    const { couponId } = req.body
  
    if (!couponId || !mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(404).redirect(`/admin/coupon?message=${encodeURIComponent('Invalid coupon ID')}`);
    }
    const couId = await Coupon.findById(couponId)
    if (couId === undefined) {
      return res.status(404).redirect(`/admin/coupon?message=${encodeURIComponent('Coupon not found')}`);
    }
    try {
      await Coupon.deleteOne({ _id: couponId });
      return res.status(200).json({ message: "Coupon deleted Successfully" })
    } catch (e) {
      console.log(e.message);
    }
  }


const applyCoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;
        //console.log(req.body)
        //validation  before processing
        if (!couponCode) {
            return res.status(401).json({ message: "Coupon code is required." });
        }
        
        
        const coupon = await Coupon.findOne({ couponCode: couponCode });

        // Check if coupon is applicable based on conditions

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found." });
        }
        if (coupon.minPurchaseAmt > totalAmount) {
            return res.status(408).json({ message: `Insufficiant Purchase amount, ${coupon.minPurchaseAmt} is requered` });
        }

        if (coupon.status===false) {
            return res.status(400).json({ message: `This coupon is Blocked ,You Can't Add This` });
        }

        
        if (coupon.minPurchaseAmt > totalAmount) {
            return res.status(400).json({ message: `This coupon is only valid for Purchases Over ${coupon.minPurchaseAmt}` });
        }

        //Calculate discount & apply coupon
        const discountAmount = (totalAmount * coupon.discountPercentage) / 100;
        const couponDiscount = Math.min(discountAmount, coupon.maxRedimabelAmount);
        const grandTotal= totalAmount - couponDiscount

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

module.exports={
//offer
    offers,
    addOfferPage,
    addOffer,
    offerDatails,
    offerStatusChange,
    deleteOffer,
// Coupon
    coupon, 
    addCouponPage,
    addCoupon,
    couponStatusChange,
    deleteCoupon,
    applyCoupon,
    removeCoupon
}

