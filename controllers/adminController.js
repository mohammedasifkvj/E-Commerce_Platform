//Load Sign in
const loadSignin=async(req,res)=>{
    try {
      res.render('1_login')  
    } catch (error) {
      console.log(error.message);  
    }
  }

  module.exports={
    loadSignin
  }