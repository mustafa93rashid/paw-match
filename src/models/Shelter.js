const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    type: { type: String, required: true },
    shelterImages: { type: [String], required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point', required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    socialMedia: { type: [String], required: true },
    workingHours: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    capacity: { type: Number },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
}, { 
    timestamps: true 
});

// دعم البحث الجغرافي للموقع
shelterSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shelter', shelterSchema);