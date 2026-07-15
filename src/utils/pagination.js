

const Animal = require("../models/Animal");
const getPaginatedAnimals= async (query,page = 1, limit = 10, filters = {}) => {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        query
            .skip(skip)
            .limit(limit),

        query.model.countDocuments(filters)
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

module.exports =  getPaginatedAnimals;