const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, 
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    role: {
      type: String,
      enum: ['superadmin', 'shelterEmployee', 'vet', 'adopter'],
      required: [true, 'Role is required']
    },
   /*  
    shelterEmployeeProfile: {
      shelterId: {
        type: mongoose.Types.ObjectId,
        ref: 'Shelter', // ربط مع كولكشن الملاجئ
        default: null
      }
    }, */

    vetProfile: {
      specialization: { type: String, trim: true, default: null },
      bio: { type: String, trim: true, default: null },
      experienceYears: { type: Number, default: 0 },
      availableDays: { type: [String], default: [] },
      consultationTypes: {
        type: [String],
        enum: ['vetConsultation', 'behaviorTraining'],
        default: [] },
      shelterId: {
        type: mongoose.Types.ObjectId,
        ref: 'Shelter', // ربط مع كولكشن الملاجئ
        default: null
      }
    },
    profileImage: {
      type: String,
      default: null
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true 
    }
  },
  {
    timestamps: true 
  }
);


module.exports = mongoose.model('User', userSchema);
