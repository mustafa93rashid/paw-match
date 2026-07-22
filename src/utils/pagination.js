// middlewares/pagination.middleware.js

const pagination = (Model) => {
  return async (req, res) => {
    // ==================================================
    // Read pagination values from query parameters
    // ==================================================
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    // Prevent invalid pagination values
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    // Prevent requesting a very large number of records
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // ==================================================
    // Get paginated records and total records count
    // ==================================================
    const [data, totalItems] = await Promise.all([
      Model.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      Model.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // ==================================================
    // Return paginated response
    // ==================================================
    return res.status(200).json({
      success: true,
      count: data.length,
      pagination: {
        currentPage: page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      data,
    });
  };
};

module.exports = pagination;