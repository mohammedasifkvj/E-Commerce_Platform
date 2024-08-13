const Category = require('../models/category');
const Product = require('../models/product');
const mongoose = require('mongoose')

// Category Page
exports.showCategory = async (req, res) => {
  const { message, success } = req.query
  try {
    const page = parseInt(req.query.page) || 1;
    const limit =10; // Number of category per page
    const skip = (page - 1) * limit;
    const category = await Category.find().skip(skip).limit(limit);
    const totalCategory=await Category.countDocuments();
    const totalPages = Math.ceil(totalCategory / limit);
    return res.render('3_category', {
      category,
      currentPage: page,
      totalPages, 
      message,
      success
    });
  } catch (e) {
    console.log(e);
  }
};

//Load  Create category Page 
exports.createCat = async (req, res) => {
  const { message, success } = req.query
  try {
    const category = await Category.find();
    return res.render("4_createCat", { category, message, success });
  } catch (e) {
    console.log(e.message);
  }
}

// Create new Category
exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    if (!name){
      return res.status(401).json({ message: 'Name is required'});
      //return res.redirect(`/admin/createCat?message=${encodeURIComponent('Name is required')}`);
    }
    if (!description){
      return res.status(401).json({ message: 'Description is required'});
      //return res.redirect(`/admin/createCat?message=${encodeURIComponent('Description is required')}`);
    }
    // Perform case-insensitive search for existing category
    const isExist = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (isExist) {
      return res.status(403).json({ message: name +' category already exists'});
      //return res.staus(403).redirect(`/admin/createCat?message=${encodeURIComponent(name +' category already exists')}`);
    }

    await Category.create({ name, description });

    return res.status(201).json({ success: true, message: 'New category '+ name +' created successfully'});
    //return res.redirect(`/admin/showCategory?success=${encodeURIComponent('New category ' + name + ' created successfully')}`);
  } catch (e) {
    console.log(e);
  }
};


// Edit Category Page 
exports.editCategoryPage = async (req, res) => {
  const { message, success } = req.query
  const { categoryId } = req.params;
  // Validate categoryId
  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    console.log('Invalid Category ID');
    return res.status(404).render('404Admin')
    //return res.status(404).send('Invalid address ID');
  }
  const categoryData = await Category.findById(categoryId)
  if (categoryData == undefined) {
    console.log('Invalid or missing category ID');
    return res.redirect(`/admin/showCategory?message=${encodeURIComponent('Category not found')}`);
  }
  // if (!categoryData) {
  //   // return res.json({ success: false, message: 'Category not found' });
  //   return res.redirect(`/admin/showCategory?message=${encodeURIComponent('Category not found')}`);
  // }
  try {
    const category = await Category.findById(categoryId);
    return res.render('5_editCategory', {
      category,
      message,
      success
    });
  } catch (e) {
    console.log(e);
  }
}

// Edit Category
exports.editCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { categoryId } = req.params;
    //console.log(categoryId)
    // Validate categoryId
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log('Invalid Category ID');
      return res.status(404).render('404Admin')
      //return res.status(404).send('Invalid address ID');
    }
    const categoryData = await Category.findById(categoryId);
    if (categoryData == undefined) {
      console.log('Invalid or missing category ID');
      return res.redirect(`/admin/showCategory?message=${encodeURIComponent('Category not found')}`);
    }

    if (!name){
      return res.status(401).json({message:'Name is required'})
      //return res.redirect(`/admin/showCategory?message=${encodeURIComponent('Name is required')}`);
    }
    if (!description){
      return res.status(401).json({message:'Description is required'})
      //return res.redirect(`/admin/showCategory?message=${encodeURIComponent('Description is required')}`);
    }
    //Perform case-insensitive search for existing category
    const isExist = await Category.findOne({ _id: { $ne: categoryId },name: { $regex: new RegExp(`^${name}$`,'i')}});

    if (isExist) {
      return res.status(402).json({message:name + ' category already exists'})
      //return res.redirect(`/admin/ShowCategory?message=${encodeURIComponent(name + ' category already exists')}`);
    }

    await Category.updateOne({ _id: categoryId },
      {$set:{name,description}},
      { new: true });
     return res.status(200).json({ success: true, message:name+' Category Updated successfully' });
    //return res.redirect(`/admin/showCategory?success=${encodeURIComponent('Category '+ name +' Updated successfully')}`);

  } catch (e) {
    console.log(e.message);
    //return res.json({ success: false, message: 'An error occurred' });
    return res.redirect(`/admin/showCategory?message=${encodeURIComponent('An error occurred')}`);
  }
}

exports.listUnlistCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    // Validate categoryId
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      console.log('Invalid Category ID');
      return res.status(404).render('404Admin')
      //return res.status(404).send('Invalid address ID');
    }
    const categoryData = await Category.findById(categoryId);
    // if (categoryData == undefined) {
    //   console.log('Invalid or missing category ID');
    //   return res.status(404).render('404Admin')
    // }
   
    if (!categoryData) {
      return res.json({ success: false, message: 'Category is not found' });
    }

    const name = categoryData.name

    if (categoryData.isDeleted) {
      await Category.findByIdAndUpdate(categoryId, { $set: { isDeleted: false } }, { new: true });
      await Product.updateMany({ category: name }, { $set: { isDeleted: false } }, { new: true });
      return res.json({ success: true, message: `Category ${name} Hided successfully` });
    } else {
      await Category.findByIdAndUpdate(categoryId, { $set: { isDeleted: true } }, { new: true });
      await Product.updateMany({ category: name }, { $set: { isDeleted: true } }, { new: true });
      return res.json({ success: true, message: `Category ${name} Hided successfully`});
    }

  } catch (e) {
    console.log(e.message);
    res.json({ success: false, message: 'An error occurred' });
  }
};