const Category = require('../models/category');
const path=require("path");

// // Category Page
// exports.loadCategory = async (req,res)=>{
//   const {error, success,name} = req.query
//   try {
//          const category= await Category.find({name});
//         return res.render("3_category", { category,error, success });
//   } catch (e) {
//     console.log(e.message);
//   }
// }

// Category Page
exports.showCategory = async (req, res) => {
    const { error, success } = req.query;
    try {
        const q = req.query.q || ''; // Fetch the query parameter if it exists
        const category= await Category.find({ name: { $regex: ".*" + q + ".*", $options: 'i' } });
        return res.render('3_category', { category, q, error, success });
    } catch (e) {
        console.log(e.message);
    }
  };
  
  //Load  Create category Page 
  exports.createCat = async (req,res)=>{
    const {error, success,name} = req.query
    try {
           const category= await Category.find({name});
          return res.render("4_createCat", { category,error, success });
    } catch (e) {
      console.log(e.message);
    }
  }
  
  // Create new Category
  exports.createCategory = async (req,res) =>{
    const {name,description} = req.body;
    try{
        if(!name)
            return res.redirect(`/admin/createCat?error=${encodeURIComponent('Name is required')}`);
        if(! description)
            return res.redirect(`/admin/createCat?error=${encodeURIComponent('Description is required')}`);
  
        const isExist = await Category.findOne({name});
        if(isExist){
           return res.redirect(`/admin/createCat?error=${encodeURIComponent(name+' Category is already exists')}`);
        } 
         await Category.create({name,description})
  
        return res.redirect(`/admin/showCategory?success=${encodeURIComponent('New Category '+name+' created successfully')}`); 
        }catch(e){
        console.log(e);
    }
  }

// Edit Category Page 
exports.editCategoryPage = async (req, res) => {
    const { id } = req.params;
    const {error, success} = req.query
    const  category= await Category.findOne({ uid: id });
    return res.render("5_editCategory", { category,error, success });
}
// exports.editCategoryPage = async (req, res) => {
//     const { id } = req.params;
//      try {
//     const {error, success} = req.query
//     const category = await Category.findOne({ uid: id });
//     console.log('reached');
//     return res.render("5_editCategory", { category ,error, success});
// } catch (e) {
//     console.log(e);
//   }
// }

// Edit Category
exports.editCategory = async (req, res) => {
    const { id } = req.params;
    const {  name,description } = req.body;
    try {
      if(!name)
        return res.redirect(`/admin/category?error=${encodeURIComponent('Name is required')}`);
    if(! description)
        return res.redirect(`/admin/category?error=${encodeURIComponent('Description is required')}`);
      const category = await Category.findOneAndUpdate(
        { uid: id },
        {
          $set: {
            name,
            description
          },
        },
        { new: true }
      );

      if (!category)
        return res.redirect(
          `/admin/showCategory?error=${encodeURIComponent(name+" Category not found!")}`
        );

      return res.redirect(
        `/admin/showCategory?success=${encodeURIComponent(name+" Category Updated Successfully")}`
      );
    } catch (e) {
      console.log(e);
    }
}



// //----------------------------------------
// exports.editCategory= async (req, res) => {
//     const { id } = req.params;
//     const { name,description } = req.body;
//     try {
//       const category = await Category.findOneAndUpdate(
//         {  uid:id },
//         {$set: {
//             name,
//             description
//           },
//         },
//         { new: true }
//       );

//       if (!category)
//         return res.redirect(
//           `/admin/showCategory?error=${encodeURIComponent("Category not found!")}`
//         );
//       return res.redirect(
//         `/admin/showCategory?success=${encodeURIComponent(category+" Updated Successfully")}`
//       );
//     } catch (e) {
//       console.log(e);
//     }
// }





















// const multer=require('multer');

// const storage=multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,path.join(__dirname,'../public/images'));
//     },
//     filename:function(req,file,cb){
//         const name=Date.now()+'-'+file.originalname;
//         cb(null,name)
//     }
// });
// const upload=multer({storage:storage})

// // Function to add a new category
// exports.addCategory = async (req, res) => {
//     const { name, imageUrl, description, status } = req.body;

//     try {
//         const newCategory = new Category({
//             name,
//             imageUrl,
//             description,
//             status
//         });

//         await newCategory.save();
//         res.status(201).json({ message: 'Category added successfully', category: newCategory });
//     } catch (error) {
//         res.status(500).json({ message: 'Error adding category', error });
//     }
// };




// // Function to edit an existing category
// exports.editCategory = async (req, res) => {
//     const { id } = req.params;
//     const { name, imageUrl, description, status, isDeleted } = req.body;

//     try {
//         const updatedCategory = await Category.findByIdAndUpdate(
//             id,
//             { name, imageUrl, description, status, isDeleted },
//             { new: true }
//         );

//         if (!updatedCategory) {
//             return res.status(404).json({ message: 'Category not found' });
//         }

//         res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
//     } catch (error) {
//         res.status(500).json({ message: 'Error updating category', error });
//     }
// };


// exports.editUser = async (req, res) => {
//     const { id } = req.params;
//     const user = await User.findOne({ uid: id });
//     return res.render("admin/user_edit", { user });
// }
