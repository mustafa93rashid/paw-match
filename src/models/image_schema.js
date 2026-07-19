const mongoose = require("mongoose");
<<<<<<< HEAD

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      default: null,
    },
    publicId: {
      type: String,
      required: true,
      default: null,
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

=======
const imageSchema = new mongoose.Schema(
  {
    url: String,//: String { type: String, required: true },
    publicId: String // { type: String, required: true },
  },
  { _id: false },
);
>>>>>>> origin/main
module.exports = imageSchema;