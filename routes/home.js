const express = require("express");
const router = express.Router();
const User = require('../models/users')
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");
const Items = require('../models/items');
const Cart = require('../models/carts');
const Order = require('../models/orders');

router.get('/', (req, res) => {
    res.render('home');
})

router.get('/signup', (req, res) => {
    res.render('sign-up');
})
router.get('/login', (req, res) => {
    res.render('login');
})

//get users route
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('username -_id'); // exclude _id
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

//post signup route
router.post('/users', async (req, res) => {

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send("Username and password are required");
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send("Username already taken");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            password: hashedPassword
        });

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

})
//post login route
router.post('/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).send("Invalid username");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send("Incorrect password");

        const token = uuidv4();
        user.token = token;
        await user.save();

        res.cookie("authToken", token, {
            httpOnly: true,     // stops JavaScript from reading cookie
            secure: false,      // true only in HTTPS / production
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });

        res.redirect('/items')

    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
})
//middleware
const getToken = async (req, res, next) => {
    try {
        const token = req.cookies.authToken;

        if (!token) {
            return res.status(401).send("Login required");
        }

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(401).send("Invalid session");
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).send("Authentication failed");
    }
};
//get item route
router.get('/items', getToken, async (req, res) => {
    try {

        //get cart
        const cart = await Cart.findOne({ user_id: req.user._id });

        let cart_items = [];
        let total = 0;

        if (cart && cart.items.length > 0) {
            cart_items = await Items.find({ _id: { $in: cart.items } });
            total = cart.amount;
        }

        //Get all items
        const items = await Items.find();

        //Get last order
        // const lastOrder = await Order.findOne({ user_id: req.user._id })
        //                              .sort({ createdAt: -1 });
        const lastOrder = await Order.findOne({ user_id: req.user._id }).sort({ createdAt: -1 }).lean();

        let order_items = [];

        if (lastOrder && lastOrder.items.length > 0) {
            order_items = await Items.find({ _id: { $in: lastOrder.items } });
        }

        const order_history = await Order.find({ user_id: req.user._id }).sort({ createdAt: -1 }).lean();
        let amount;
        if (lastOrder && lastOrder.amount) {
            amount = lastOrder.amount
        } else {
            amount = 0;
        }

        // Render items page (always)
        res.render('items', {
            items,
            cart_items,
            total,
            order_items,
            order_history,
            amount
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


//post item route
router.post('/items', async (req, res) => {
    try {
        const { name, amount } = req.body;
        let numericAmount = Number(amount);

        if (!name || !numericAmount) {
            return res.status(400).send("Name and amount are required");
        }
        const items = await Items.create({ name, amount: numericAmount });
        res.send("done");



    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
})

// post cart route  to create cart
router.post("/carts", getToken, async (req, res) => {
    const { itemId } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: "Item ID required" });
    }

    try {

        let cart = await Cart.findOne({ user_id: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                user_id: req.user._id,
                items: []
            });

            const user = await User.findById(req.user._id);
            user.cart_id = cart._id;
            await user.save();
        }

        const item = await Items.findById(itemId);


        if (cart.items.includes(itemId)) {
            return res.json({ message: "Item already exists in cart", cart });
        }


        cart.items.push(itemId);
        cart.amount += item.amount;
        await cart.save();

        return res.json({ message: "Item added to cart", cart });

    } catch (err) {
        console.log("Cart error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});


// get cart route to list all cart

router.get('/carts', async (req, res) => {
    const carts = await Cart.find();
    res.json(carts);

})

// post order route, (convert cart to order)
router.post('/orders', getToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user_id: req.user._id }).lean();

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // Create new order
        const order = await Order.create({
            user_id: req.user._id,
            items: cart.items,
            amount: cart.amount
        });

        // Delete cart
        await Cart.deleteOne({ user_id: req.user._id });

        // Redirect to items page
        res.status(200).json({ message: "Order placed successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/orders', async (req, res) => {
    const orders = await Order.find();
    res.json(orders);
})











module.exports = router;