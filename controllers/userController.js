const User = require("../models/User");

// Get all users except logged-in user

const getUsers = async (req,res)=>{

try{

const users=await User.find({
_id:{ $ne:req.user._id }
}).select("-password");

res.json(users);

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

};

module.exports={getUsers};