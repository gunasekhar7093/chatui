const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const User = require("../models/User");


// Get All Users (Exclude Myself + Admin)

router.get("/", protect, async (req,res)=>{

try{

const users = await User.find(
{ _id: { $ne: req.user._id } }
).select("name email role");

res.json(users);

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

});

module.exports = router;