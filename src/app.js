require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const xssSanitize = require("./middlewares/xss");
const shelterRouter = require("./routes/shelter.route");

app.use(express.json());
app.use(require("morgan")("dev"));
app.use(cookies());
app.use(xssSanitize);
app.use('/shelters', shelterRouter);

app.get("/api/health", (req, res) => {res.status(200).json("OK")})
app.use("/api/v1/auth", require("./routes/auth.route"));

app.use("/api/v1/debug-upload", require("./routes/test-upload.routes"));//this line is just for testin image upload

app.use("/api/v1/user", require("./routes/user.route"));
app.use("/api/v1/animals", require("./routes/animal.route"));

app.use(errorHandler);
app.use(notFound);

const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log("Connected to MONGODB Successfully");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        })
    })
    .catch(err => {
        console.log('Error MONGODB', err.message);
    })