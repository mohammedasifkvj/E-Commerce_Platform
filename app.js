const express = require("express");
const app = express();
const passport = require('passport')
require('./drivers/passport');
const cors = require('cors')
const connectDB = require('./drivers/dataBase');
const nocache = require('nocache')
const scheduler = require('./drivers/sheduler');
require('dotenv').config()

//middleware to parse JSON and url-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(cors())

// Load static assets
app.use(express.static('public'));
app.set('views', './views/users');

//connecting MongoDB
connectDB();

// Use no-cache middleware to prevent browser from caching
app.use(nocache())

// for admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);
// for user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

//404
app.all('*', (req, res) => {
   return res.status(404).render('404User', { status: 404, error: '' });
});

const port = process.env.PORT

app.listen(port, () => {
   console.log(`Listening to the server on http://127.0.0.1:${port}`);
});