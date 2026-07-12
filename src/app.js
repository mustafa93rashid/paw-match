require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const cookies = require("cookie-parser");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const xssSanitize = require("./middlewares/xss");

// Middlewares
app.use(express.json());
app.use(require("morgan")("dev"));
app.use(cookies());
app.use(xssSanitize);

// Health check
app.get("/api/health", (req, res) => {res.status(200).json("OK");});

// Authentication routes
app.use("/api/v1/auth", require("./routes/auth.route"));

// User routes
app.use("/api/v1/user", require("./routes/user.route"));

// Profile routes
app.use("/api/v1/shelter-employee-profile", require("./routes/profiles/shelterEmployeeProfile.routes"));
app.use("/api/v1/adopter-profile", require("./routes/profiles/adopterProfile.route"));
app.use("/api/v1/vet-profile", require("./routes/profiles/vetProfile.routes"));

// Shelter routes
app.use("/api/v1/shelters", require("./routes/shelter.route"));

// Animal routes
app.use("/api/v1/animals", require("./routes/animal.route"));

app.use("/api/v1/animals", require("./routes/animal.route"));

// Image upload test routes
app.use("/api/v1/adoptions", require("./routes/adoptionRequest.route"));

// Error handling
app.use(errorHandler);
app.use(notFound);

const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB Successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Error:", err.message);
  });