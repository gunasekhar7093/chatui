const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const User=require("./models/User");
const dotenv=require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

async function createAdmin(){

const salt=await bcrypt.genSalt(10);

const hashedPassword=await bcrypt.hash(
"admin123",
salt
);

await User.create({

name:"Admin",
email:"admin@gmail.com",
password:hashedPassword,
role:"admin"

});

console.log("✅ Admin Created Successfully");

process.exit();

}

createAdmin();