const express=require("express");
const app=express();

//middleware to parse JSON and url-encoded form data
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const cookieParser=require('cookie-parser')
app.use(cookieParser())

// env variables
 require('dotenv').config()

 
 //app.set('views',path.join(__dirname,"views"))
// Load static assets
app.use(express.static('public'));
//cors 
const cors =require('cors')
app.use(cors())

// Use no-cache middleware to prevent browser from caching
const nocache = require('nocache')
app.use(nocache())

//connecting MongoDB
const mongoose=require("mongoose");
mongoose.connect(process.env.MONGODB_URL_LOCAL)
.then(()=>console.log("Connected to MongoDB "))
.catch((err)=>console.log("MongoDB connectin failed"));

// for user routes
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);
// for admin routes
const adminRoute=require('./routes/adminRoute');
app.use('/admin',adminRoute);

// 404
// app.all('*', (req, res) => {
//    res.status(404).render('error', { status: 404, error: '' });
//  });

const port=process.env.PORT  || 8004;

app.listen(port, ()=> {
   console.log(`Listening to the server on http://127.0.0.1:${port}`); 
});