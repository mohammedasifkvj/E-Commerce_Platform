const {User,TempUser} = require("../models/signup")
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

//the name in views for render
//Load Sign in
const loadAdminSignIn = (req,res)=>{
    const {error, success} = req.query
    res.render('1_login',{    
        error,
        success:null
    });
}

// Admin Sign-In
const adminSignIn = async(req,res)=>{
  try {
const {email,password}=req.body

if(!(email && password)){
     return res.redirect(`/admin/SignIn?error=${encodeURIComponent('Enter all Fields')}`);
    } 
    //query from DB
    const admin = await User.findOne({email})

    if (!admin) {
       //console.log(' Account not Found');
       return res.redirect(`/admin/SignIn?error=${encodeURIComponent('Admin Account not Found')}`);
      }; 
   
      const passwordMatch=await bcrypt.compare(password,admin.password);
      if (!passwordMatch) {
        //console.log('Invalid credentials');
       return res.redirect(`/admin/SignIn?error=${encodeURIComponent("Email or password is incorrect")}`); // 401 for unauthorized
      }
       if (admin.isAdmin===false) {
        //console.log('Your Account is Blocked');
       return res.redirect(`/admin/SignIn?error=${encodeURIComponent("Only Admin have the access")}`); // 401 for unauthorized
       }

       const token=jwt.sign(
        {id:admin._id},
        process.env.JWT_ACCESS_SECRET,
        // {expiresIn:"24h"}
       );

       admin.accessToken=token;
       admin.password=undefined 
     
       const options={
       // expires:new Date(Date.now()+7*24*60*60*1000)   // 7day expiry
       httpOnly:true , // cookies can manipulate by browser only
       secure: true
       } 
      // send token in admin cookie
       res.cookie('jwtToken',token,options)
       return res.redirect('/admin/dash')  
  } catch (e) {
    console.log(e.message);
  }
}

 //Load dashBoard
const loadDash = async (req,res)=>{
  try {
    return  res.render('2_dashboard')  
    } catch (e) {
    console.log(e.message);  
    }
}

//  Load Customer details Table
  const customerTable=async(req,res)=>{
    try {
       const user = await User.find({isAdmin: false});
         //console.log(user);
        return res.render("5_customers", {user});
      }catch (e) {
      console.log(e.message);
    }
  }

const blockAndUnblockUser = async (req, res) => {
  //console.log("work")
  try {
      const { userId } = req.body;
      console.log(userId, 'this is userId');
      const userData = await User.findById(userId);
      
      if (!userData) {
        return res.json({ success: false, message: 'user not found' });
      }

     if (userData.isBlocked) {
      await User.findByIdAndUpdate(userId, { $set: { isBlocked: false } }, { new: true });
      return res.json({ success: true, message: 'user unblocked successfully' });
     } else {
      await User.findByIdAndUpdate(userId, { $set: { isBlocked: true } }, { new: true });
      return res.json({ success: true, message: 'user blocked successfully' });
     }
     
  } catch (e) {
      console.log(e.message);
      res.json({ success: false, message: 'An error occurred' });
  }
};

//Order Table
  const orderTable=async(req,res)=>{
    const {error,success} = req.query
    try {
        return res.render("6_orders", 
            );
          
      }catch (e) {
      console.log(e.message);  
    }
  }

// const updateCategory = async (req, res) => {
//     const { id } = req.params;
//     const { name, email, phone } = req.body;
//     try {
//       const user = await User.findOneAndUpdate(
//         { uid: id },
//         {
//           $set: {
//             name,
//             email,
//             phone
//           },
//         },
//         { new: true }
//       );

//       if (!user)
//         return res.redirect(
//           `/admin/dashboard?error=${encodeURIComponent("User not found!")}`
//         );

//       return res.redirect(
//         `/admin/dashboard?message=${encodeURIComponent("Updated success")}`
//       );
//     } catch (e) {
//       console.log(e);
//     }
// }

  module.exports={
    loadAdminSignIn,
    adminSignIn,
    loadDash,
    customerTable,
    blockAndUnblockUser,
    orderTable
  }