const { User } = require("../models/signup");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Wishlist = require("../models/wishList")
const jwt = require('jsonwebtoken');

//Add to cart 
const addToCart = async (req, res) => {
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    const { productId } = req.body;
    try {
        // Fetch the product details
        const product = await Product.findById(productId);

        // Check if the product is available (in stock)
        if (!product || product.stock <= 0) {
            return res.status(400).json({ message: 'Product is not available' });
        }

        // Check if a cart exists for the user
        let cart = await Cart.findOne({ userId: userId });

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
        const userId = req.user.id;
        // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
        const cart = await Cart.findOne({ userId: userId }).populate('cartItems.productId');
        const product = await Product.find({ isDeleted: false });
        if (!cart) {
            return res.render('10_cart', { cartItems: [] });
        }
        return res.render('10_cart', {
            cartItems: cart.cartItems,
            product,
        });
    } catch (e) {
        console.log(e.message);
        // res.status(500).send('An error occurred');
    }
}

const changeQuantity = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;

    if (quantity < 1 || quantity > 5) {
        return res.status(400).json({ message: 'Quantity must be between 1 and 5.' });
    }

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: `Only ${product.stock} units available for ${product.productName}.` });
        }

        const cart = await Cart.findOne({ userId: userId });
        const cartItem = cart.cartItems.find(item => item.productId.toString() === productId);
        //console.log(cartItem)
        if (cartItem) {
            cartItem.quantity = quantity;
        }
        await cart.save();

        // Calculate new total and send response
        const car = await Cart.findOne({ userId: userId }).populate('cartItems.productId');

        let newTotal = car.cartItems.reduce((total, item) => total + item.quantity * item.productId.discountPrice, 0);

        // Calculate total for the specific product
        const productTotal = cartItem.quantity * cartItem.productId.discountPrice;

        return res.json({
            newQuantity: cartItem?.quantity,
            newTotal: newTotal,
            productTotal: productTotal
            //discount: discount
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Delete single product from cart
const deleteProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
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
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        // cart.cartItems = [];
        // await cart.save();
        await Cart.deleteOne({ userId });
        return res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const increaseQuantity = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;

    try {
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

const decreaseQuantity = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    try {
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
        return res.status(500).json({ error: e.message });
    }
}

//-------------------Wish List--------------------------------//

const addToWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
    try {
        // Check if a cart exists for the user
        let wishlist = await Wishlist.findOne({ userId: userId });

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
        return res.status(500).json({ error: e.message });
    }
}

//Remove product from Wish List 
const removeProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;
    // const userId = jwt.verify(req.cookies.jwtToken, process.env.JWT_ACCESS_SECRET).id;
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
        return res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    //CART
    loadCart,
    addToCart,
    changeQuantity,
    increaseQuantity,
    decreaseQuantity,
    deleteProduct,
    clearCart,
    //Wish list
    addToWishlist,
    removeProduct
}