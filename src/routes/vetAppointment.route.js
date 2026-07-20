const express = require("express");
const router = express.Router();

const vetAppointmentController = require("../controllers/vetAppointment.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const {requestAppointmentValidation,scheduleAppointmentValidation,updateAppointmentStatusValidation,appointmentIdValidation} = require("../validation/vetAppointment.validate");

// Create a new appointment request
router.post("/",[auth, role(["adopter"]), ...requestAppointmentValidation],asyncHandler(vetAppointmentController.request));

// Get the current adopter appointments
router.get("/my",[auth, role(["adopter"])],asyncHandler(vetAppointmentController.getMyAppointments));

// Get the current vet appointments
router.get("/vet",[auth, role(["vet"])],asyncHandler(vetAppointmentController.getVetAppointments));

// Get all appointments
router.get("/admin/all",[auth, role(["superadmin"])],asyncHandler(vetAppointmentController.getAll));

// Schedule an appointment
router.patch("/:id/schedule",[auth, role(["vet"]), ...scheduleAppointmentValidation],asyncHandler(vetAppointmentController.schedule));

// Update appointment status
router.patch("/:id/status",[auth, role(["vet"]), ...updateAppointmentStatusValidation],asyncHandler(vetAppointmentController.updateStatus));

// Cancel an appointment
router.patch("/:id/cancel",[auth, role(["adopter"]), ...appointmentIdValidation],asyncHandler(vetAppointmentController.cancel));

// Get one appointment
router.get("/:id",[auth, role(["adopter", "vet", "superadmin"]), ...appointmentIdValidation],asyncHandler(vetAppointmentController.getById));

module.exports = router;