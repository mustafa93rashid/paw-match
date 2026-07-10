const Shelter = require('../models/Shelter');

// 1. إنشاء مأوى جديد (POST /shelters) -> Status 201
const createShelter = async (req, res, next) => {
    try {
        const newShelter = await Shelter.create(req.body);
        return res.status(201).json({
            success: true,
            message: "Shelter created successfully",
            data: {
                _id: newShelter._id,
                name: newShelter.name
            }
        });
    } catch (error) {
        next(error);
    }
};

// 2. جلب جميع الملاجئ النشطة (GET /shelters) -> Status 200
const getAllShelters = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const query = {
            isActive: true,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ]
        };

        const total = await Shelter.countDocuments(query);
        const shelters = await Shelter.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: shelters
        });
    } catch (error) {
        next(error);
    }
};

// 3. جلب بيانات مأوى محدد (GET /shelters/:id) -> Status 200
const getShelterById = async (req, res, next) => {
    try {
        const shelter = await Shelter.findById(req.params.id);
        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }
        return res.status(200).json({
            success: true,
            data: shelter
        });
    } catch (error) {
        next(error);
    }
};

// 4. تحديث بيانات المأوى (PUT /shelters/:id) -> Status 200
const updateShelter = async (req, res, next) => {
    try {
        const { name, phone, capacity, description } = req.body;
        const updatedShelter = await Shelter.findByIdAndUpdate(
            req.params.id,
            { name, phone, capacity, description },
            { new: true, runValidators: true }
        );

        if (!updatedShelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shelter updated successfully",
            data: {
                _id: updatedShelter._id,
                name: updatedShelter.name,
                capacity: updatedShelter.capacity,
                updatedAt: updatedShelter.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// 5. توثيق المأوى (PATCH /shelters/:id/verify) -> Status 200
const verifyShelter = async (req, res, next) => {
    try {
        const { isVerified } = req.body;
        const shelter = await Shelter.findByIdAndUpdate(
            req.params.id,
            { isVerified },
            { new: true }
        );

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shelter verification status updated successfully",
            data: {
                _id: shelter._id,
                isVerified: shelter.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

// 6. تفعيل أو إلغاء تفعيل المأوى (PATCH /shelters/:id/activation) -> Status 200
const toggleActivation = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const shelter = await Shelter.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shelter activation status updated successfully",
            data: {
                _id: shelter._id,
                isActive: shelter.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// 7. حذف المأوى (DELETE /shelters/:id) -> Status 200
const deleteShelter = async (req, res, next) => {
    try {
        const shelter = await Shelter.findByIdAndDelete(req.params.id);
        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: "Shelter not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Shelter deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShelter,
    getAllShelters,
    getShelterById,
    updateShelter,
    verifyShelter,
    toggleActivation,
    deleteShelter
};