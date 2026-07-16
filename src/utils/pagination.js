

const Animal = require("../models/Animal");

const getPaginatedAnimals=  (req, res, next) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;


    const skip = (page - 1) * limit;

    req.pagination = {
        page,
        limit,
        skip
    };

    next();
};

module.exports =  getPaginatedAnimals;