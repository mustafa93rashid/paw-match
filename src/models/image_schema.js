const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      default: null,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      default: null,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);


module.exports = imageSchema;