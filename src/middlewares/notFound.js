const notFound = (req, res, next) => {
    return res.status(404).json("This route does not exist")
}   

module.exports = notFound;