const cron = require('node-cron');
const Category = require('../models/category');
const Product = require('../models/product');
const Offer = require('../models/offer');

//  update expired offers
const updateExpiredOffers = async () => {
    try {
        // Get current date
        const now = new Date();

        // Find offers that have expired
        const expiredOffers = await Offer.find({ expDate: { $lt: now }, status: true });

        if (expiredOffers.length > 0) {
            for (let offer of expiredOffers) {
                // Deactivate the offer
                offer.status = false;
                await offer.save();

                // Update products affected by the expired offer
                if (offer.type === 'Product Offer') {
                    await Product.updateOne(
                        { productName: offer.productName },
                        { $pull: { offer: offer._id }, $set: { discountPrice: '$price' } } // Reset discountPrice to price
                    );
                } else if (offer.type === 'Category Offer') {
                    const categoryDoc = await Category.findOne({ name: offer.category });
                    if (categoryDoc) {
                        await Product.updateMany(
                            { category: categoryDoc.name },
                            { $pull: { offer: offer._id }, $set: { discountPrice: '$price' } } // Reset discountPrice to price
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating expired offers:', error.message);
    }
};

// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', updateExpiredOffers);
