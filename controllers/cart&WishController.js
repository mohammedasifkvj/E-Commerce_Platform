const { User }= require("../models/signup");
const Product= require("../models/product");
const Category=require("../models/category");
const Cart=require("../models/cart");
const Wishlist=require("../models/wishList")
const Address=require("../models/address");
const jwt = require('jsonwebtoken');

//Add to cart 
// const addToCart = async (req, res) => {
//     try {
//         const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         console.log(userId, 'This is userId');
//         const { productId } = req.body;
//         console.log(productId, 'This is productId');

//         // Check if a cart exists for the user
//         const cart = await Cart.findOne({ userId: userId });

//         if (cart) {
//             // Check if the product already exists in the cart
//             const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

//             if (itemIndex > -1) {
//                 // Product exists in the cart, update the quantity
//                 cart.cartItems[itemIndex].quantity += 1;
//             } else {
//                 // Product does not exist in the cart, add as a new item
//                 cart.cartItems.push({
//                     productId: productId,
//                     quantity: 1
//                 });
//             }
//         } else {
//             // No cart exists for the user, create a new cart
//             cart = new Cart({
//                 userId: userId,
//                 cartItems: [{
//                     productId: productId,
//                     quantity: 1
//                 }]
//             });
//         }

//         // Save the cart
//         await cart.save();
//         res.status(200).json(cart);

//     } catch (e) {
//         console.log(e.message);
//         res.status(500).json({ error: e.message });
//     }
// }

// const addToCart = async (req, res) => {
//     try {
//         const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         //console.log(userId, 'This is userId');
//         const { productId } = req.body;
//         //console.log(productId, 'This is productId');

//         // Check if a cart exists for the user
//         const cart = await Cart.findOne({ userId: userId });

//         if (cart) {
//             // Check if the product already exists in the cart
//             const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

//             if (itemIndex > -1) {
//                 // Product exists in the cart, update the quantity
//                 // cart.cartItems[itemIndex].quantity += 1;
//                 // await cart.save();
//                 return res.status(200).json({ message: 'Product already exists in cart' });
//             } else {
//                 // Product does not exist in the cart, add as a new item
//                 cart.cartItems.push({
//                     productId: productId,
//                     quantity: 1
//                 });
//                 await cart.save();
//                 return res.status(200).json({ message: 'Product added to cart' });
//             }
//         } else {
//             // No cart exists for the user, create a new cart
//             cart = new Cart({
//                 userId: userId,
//                 cartItems: [{
//                     productId: productId,
//                     quantity: 1
//                 }]
//             });
//             await cart.save();
//             return res.status(200).json({ message: 'Cart created and product added' });
//         }

//     } catch (e) {
//         console.log(e.message);
//         res.status(500).json({ error: e.message });
//     }
// }

const addToCart = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const { productId } = req.body;

        // Fetch the product details
        const product = await Product.findById(productId);

        // Check if the product is available (in stock)
        if (!product || product.stock <= 0) {
            return res.status(400).json({ message: 'Product is not available' });
        }

        // Check if a cart exists for the user
        const cart = await Cart.findOne({ userId: userId });

        if (cart) {
            // Check if the product already exists in the cart
            const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Product exists in the cart
                return res.status(200).json({ message: 'Product already exists in cart' });
            } else {
                // Product does not exist in the cart, add as a new item
                cart.cartItems.push({
                    productId: productId,
                    quantity: 1
                });
                await cart.save();
                return res.status(200).json({ message: 'Product added to cart' });
            }
        } else {
            // No cart exists for the user, create a new cart
            cart = new Cart({
                userId: userId,
                cartItems: [{
                    productId: productId,
                    quantity: 1
                }]
            });
            await cart.save();
            return res.status(200).json({ message: 'Cart created and product added' });
        }
    } catch (e) {
        console.log(e.message);
        //res.status(500).json({ error: e.message });
    }
}


// To load Cart
const loadCart = async (req, res) => {
    try {
      const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
      const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
      const product=await Product.find({isDeleted:false});
        if (!cart) {
            return res.render('10_cart', { cartItems: [] });
        }
        return res.render('10_cart', { 
            cartItems: cart.cartItems ,
            product
        });
    } catch (e) {
        console.log(e.message);
       // res.status(500).send('An error occurred');
    }
}
  
const increaseQuantity = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const { productId } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the product in the cart
        const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Product exists in the cart, check quantity
            if (cart.cartItems[itemIndex].quantity < 5) {
                cart.cartItems[itemIndex].quantity += 1;
                await cart.save();
                return res.status(200).json({ message: 'Product quantity increased' });
            } else {
                return res.status(400).json({ message: 'Maximum quantity reached' });
            }
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (e) {
        console.log(e.message);
       // res.status(500).json({ error: e.message });
    }
}


// const increaseQuantity1= async (req, res) => {
//     //(with decrease stock)
//     try {
//         const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
//         const { productId } = req.body;

//         // Find the user's cart
//         const cart = await Cart.findOne({ userId: userId });

//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Find the product in the cart
//         const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

//         if (itemIndex > -1) {
//             // Product exists in the cart, check quantity
//             const product = await Product.findById(productId);

//             if (!product) {
//                 return res.status(404).json({ message: 'Product not found' });
//             }

//             const currentQuantity = cart.cartItems[itemIndex].quantity;
//             const desiredQuantity = currentQuantity + 1;

//             if (desiredQuantity > 5) {
//                 return res.status(400).json({ message: 'Maximum quantity reached' });
//             }

//             if (desiredQuantity <= product.stock) {
//                 cart.cartItems[itemIndex].quantity = desiredQuantity;
//                 await cart.save();
//                 return res.status(200).json({ message: 'Product quantity increased' });
//             } else {
//                 return res.status(400).json({ message: 'Exceeds available stock' });
//             }
//         } else {
//             return res.status(404).json({ message: 'Product not found in cart' });
//         }
//     } catch (e) {
//         console.log(e.message);
//         res.status(500).json({ error: e.message });
//     }
// };


const decreaseQuantity = async (req, res) => {
    try {

        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const { productId } = req.body;

        // Find the user's cart
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the product in the cart
        const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            // Product exists in the cart, check quantity
            if (cart.cartItems[itemIndex].quantity > 1) {
                cart.cartItems[itemIndex].quantity -= 1;
                await cart.save();
                return res.status(200).json({ message: 'Product quantity decreased', cartItems: cart.cartItems });
            } else {
                return res.status(400).json({ message: 'Minimum quantity reached' });
            }
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (e) {
        console.log(e.message);
        res.status(500).json({ error: e.message });
    }
}
 // Delete single product from cart
const deleteProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        //cart.cartItems = cart.cartItems.filter(item => item.productId.toString() !== productId);
        //await cart.save();
        await Cart.updateOne(
            { userId: userId },
            { $pull: { cartItems: { productId: productId } } }
          );
        return res.status(200).json({ cartItems: cart.cartItems });
        //.json({ cartItems: cart.cartItems });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Clear the Cart
const clearCart = async (req, res) => {
    
   // const { productId } = req.body;
    const userId = req.user.id;
   // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.cartItems = [];
        await cart.save();
       return  res.status(200).json({ cartItems: cart.cartItems });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};


//-------------------Wish List--------------------------------//

const addToWishlist = async (req, res) => {
    try {
        const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        //console.log(userId, 'This is userId');
        const { productId } = req.body;
        //console.log(productId, 'This is productId');

        // Check if a cart exists for the user
        const wishlist = await Wishlist.findOne({ userId: userId });

        if (wishlist) {
            // Check if the product already exists in the Wishlist
            const itemIndex = wishlist.wishlistItems.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                // Product exists in the cart, update the quantity
                // cart.cartItems[itemIndex].quantity += 1;
                // await cart.save();
                return res.status(200).json({ message: 'Product already exists in Wishlist' });
            } else {
                // Product does not exist in the wishlist, add as a new item
                wishlist.wishlistItems.push({
                    productId: productId
                });
                await wishlist.save();
                return res.status(200).json({ message: 'Product added to Wishlist' });
            }
        } else {
            // No cart exists for the user, create a new cart
            wishlist = new Wishlist({
                userId: userId,
                wishlistItems: [{
                    productId: productId
                }]
            });
            await wishlist.save();
            return res.status(200).json({ message: 'Wishlist created and product added' });
        }

    } catch (e) {
        console.log(e.message);
        console.log(e);
       // res.status(500).json({ error: e.message });
    }
}

//Remove product from Wish List 
const removeProduct = async (req, res) => {
    const { productId } = req.body;
    //const userId = req.user.id;

    const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;

    try {
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) return res.status(404).json({ message: 'Cart not found' });

        //cart.cartItems = cart.cartItems.filter(item => item.productId.toString() !== productId);
        //await cart.save();
        await Wishlist.updateOne(
            { userId: userId },
            { $pull: { wishlistItems: { productId: productId } } }
          );
        return res.status(200).json({ wishlistItems: wishlist.wishlistItems });
    } catch (e) {
        console.log(e.message);
        console.log(e);
        //res.status(500).json({ error: 'Server error' });
    }
};

module.exports={
//CART
    loadCart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    deleteProduct,
    clearCart,
//Wish list
    addToWishlist,
    removeProduct
}