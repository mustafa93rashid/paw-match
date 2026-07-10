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