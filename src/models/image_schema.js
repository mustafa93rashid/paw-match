const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema(
  {
    url: String,//: String { type: String, required: true },
    publicId: String // { type: String, required: true },
  },
  { _id: false },
);
module.exports = imageSchema;