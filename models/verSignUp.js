const mongoose=require("mongoose");
const jwt =require('jsonwebtoken');
const { required } = require("@hapi/joi");

const verificationSchema=new mongoose.Schema({
    userId:String,
    createdAt:Date

},{timestamps:true});