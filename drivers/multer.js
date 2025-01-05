const path=require("path");
const multer=require('multer');

// const storage=multer.diskStorage({
//     destination:function(req,file,cb){
//         console.log('i am here in multer',file)
//         cb(null,path.join(__dirname,'../public/productImages'));
//     },
//     filename:function(req,file,cb){
//         const name=Date.now()+'-'+file.originalname;
//         cb(null,name)
//     }
// });
// const upload=multer({storage:storage}).fields([
//     {name:"productImage1",maxCount:1},
//     {name:"productImage2",maxCount:1},
//     {name:"productImage3",maxCount:1},
//     {name:"productImage4",maxCount:1},
// ])

// Define storage
const storage = multer.memoryStorage();

// Define file filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

// Configure multer to accept any number of files with any field names
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});
module.exports=upload
