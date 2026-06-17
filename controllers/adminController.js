const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Admin Login
const adminLogin = async (req,res)=>{

const {email,password} = req.body;

try{

const admin = await User.findOne({
email:email,
role:"admin"
});

if(!admin){
return res.status(401).json({
message:"Invalid admin"
});
}

const match = await bcrypt.compare(
password,
admin.password
);

if(!match){
return res.status(401).json({
message:"Wrong password"
});
}

const token = jwt.sign(
{ id:admin._id },
process.env.JWT_SECRET,
{expiresIn:"7d"}
);

res.json({
token
});

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

};

module.exports={
adminLogin
};