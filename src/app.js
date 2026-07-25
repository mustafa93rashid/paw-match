require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const morgan = require("morgan");

const { initSocket } = require("./utils/socket");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const xssSanitize = require("./middlewares/xss");

const app = express();
const server = http.createServer(app);

//=========================================================================
// Middleware Setup
//=========================================================================
app.use(express.json());
app.use(morgan("dev"));
app.use(cookies());
app.use(xssSanitize);

//=========================================================================
// API Routes
//=========================================================================

// Health check route
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// Auth and User routes
app.use("/api/v1/auth", require("./routes/auth.route"));
app.use("/api/v1/user", require("./routes/user.route"));

// Profile routes
app.use("/api/v1/shelter-employee-profile", require("./routes/profiles/shelterEmployeeProfile.routes"));
app.use("/api/v1/adopter-profile", require("./routes/profiles/adopterProfile.route"));
app.use("/api/v1/vet-profile", require("./routes/profiles/vetProfile.routes"));

// Shelter routes
app.use("/api/v1/shelters", require("./routes/shelter.route"));

// Animal routes
app.use("/api/v1/animals", require("./routes/animal.route"));

// Adoption Request routes
app.use("/api/v1/adoptions", require("./routes/adoptionRequest.route"));

// Vet Appointment routes
app.use("/api/v1/vetappointments", require("./routes/vetAppointment.route"));

// Matching routes
app.use("/api/v1/matching", require("./routes/matching.route"));

// Review routes
app.use("/api/v1/reviews", require("./routes/review.route"));

// Notification routes
app.use("/api/v1/notifications", require("./routes/notification.routes"));

// Staff Application routes (public applications + Super Admin review)
app.use("/api/v1/staff-applications", require("./routes/staffApplication.route"));

//=========================================================================
// Error Handling Middleware
//=========================================================================
app.use(notFound);
app.use(errorHandler);

//=========================================================================
// Server Initialization
//=========================================================================
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

// Initialize Socket.IO
initSocket(server);

// Connect to MongoDB and start the server
mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB Successfully");

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });