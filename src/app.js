require("dotenv").config();
const express = require("express");
const http = require("http"); 
const { initSocket } = require("./utils/socket");
const app = express();
const mongoose = require("mongoose");
const cookies = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const xssSanitize = require("./middlewares/xss");

app.use(express.json());
app.use(require("morgan")("dev"));
app.use(cookies());
app.use(xssSanitize);

app.get("/api/health", (req, res) => {res.status(200).json("OK")})

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

// Appointment routes
app.use("/api/v1/appointments", require("./routes/appointment.route"));

// Vet Appointment routes
app.use("/api/v1/vetappointments", require("./routes/vetAppointment.route"));

// Matching routes
app.use("/api/v1/matching", require("./routes/matching.route"));

// Review routes
app.use("/api/v1/reviews", require("./routes/review.route"));

// Notification routes
app.use("/api/v1/notifications", require("./routes/notification.route"));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

const server = http.createServer(app);

// 2. تهيئة الـ Sockets باستخدام السيرفر
initSocket(server);

// 3. تشغيل السيرفر من خلال المتغير server وليس app
mongoose.connect(MONGODB_URL)
    .then(() => {
        console.log("Connected to MONGODB Successfully");
        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.log('Error MONGODB', err.message);
    })