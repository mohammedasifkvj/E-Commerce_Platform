
const paginate = async (Model, page, limit) => {
    const skip = (page - 1) * limit;

    const totalItems = await Model.countDocuments();
    const items = await Model.find().skip(skip).limit(limit);
    const totalPages = Math.ceil(totalItems / limit);

    return {
        items,
        totalPages,
        currentPage: page,
    };
};

module.exports = paginate;