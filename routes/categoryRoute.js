const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController'); 

// Route to add a new category
router.post('/add', categoryController.addCategory);

// Route to edit an existing category
router.put('/edit/:id', categoryController.editCategory);

module.exports = router;
