const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { adminLogin } = require("../controllers/adminController");

const User = require("../models/User");


// ADMIN LOGIN
router.post("/login", adminLogin);


// GET USERS
router.get("/users", protect, async(req,res)=>{

try{

const users = await User.find()
.select("name email createdAt role");

res.json(users);

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

});


// DELETE USER
router.delete("/users/:id", protect, async(req,res)=>{

try{

await User.findByIdAndDelete(req.params.id);

res.json({
message:"User deleted"
});

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

});

module.exports=router;