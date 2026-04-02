const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/twedar";
  await mongoose.connect(uri);
};

module.exports = connectDB;
