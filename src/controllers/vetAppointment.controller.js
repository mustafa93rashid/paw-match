const VetAppointment = require("../models/vetAppointment");
const User = require("../models/User");

class VetAppointmentController {
  // ==================================================
  // Request a Vet Appointment
  // ==================================================
  request = async (req, res) => {
    // • Allows the adopter to request an appointment
    //   with an active veterinarian.
    // • Prevents duplicate active appointments with
    //   the same veterinarian.
    // • Creates the request with "pending" status.
    // ==================================================

    const adopterId = req.user.id;
    const { vetId, requestMessage } = req.body;

    // Verify that the veterinarian exists and is active.
    const vet = await User.findOne({
      _id: vetId,
      role: "vet",
      isActive: true,
    });

    if (!vet) {
      return res.status(404).json({
        success: false,
        message: "Active vet not found",
      });
    }

    // Prevent another pending or scheduled appointment
    // with the same veterinarian.
    const existingAppointment = await VetAppointment.findOne({
      adopterId,
      vetId,
      status: {
        $in: ["pending", "scheduled"],
      },
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "You already have an active appointment with this vet",
      });
    }

    const appointment = await VetAppointment.create({
      adopterId,
      vetId,
      requestMessage: requestMessage || "",
      status: "pending",
    });

    const data = await VetAppointment.findById(appointment._id)
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      );

    return res.status(201).json({
      success: true,
      message: "Appointment request submitted successfully",
      data,
    });
  };

  // ==================================================
  // Get Current Adopter Appointments
  // ==================================================
  getMyAppointments = async (req, res) => {
    // • Retrieves appointments belonging to the
    //   currently authenticated adopter.
    // • Supports optional filtering by status.
    // • Returns the newest requests first.
    // ==================================================

    const adopterId = req.user.id;
    const { status } = req.query;

    const filter = {
      adopterId,
    };

    if (status) {
      filter.status = status;
    }

    const appointments = await VetAppointment.find(filter)
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  };

  // ==================================================
  // Get Current Vet Appointments
  // ==================================================
  getVetAppointments = async (req, res) => {
    // • Retrieves appointments assigned to the
    //   currently authenticated veterinarian.
    // • Supports optional filtering by status.
    // • Returns scheduled appointments in chronological
    //   order.
    // ==================================================

    const vetId = req.user.id;
    const { status } = req.query;

    const filter = {
      vetId,
    };

    if (status) {
      filter.status = status;
    }

    const appointments = await VetAppointment.find(filter)
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .sort({
        appointmentDate: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  };

  // ==================================================
  // Schedule an Appointment
  // ==================================================
  schedule = async (req, res) => {
    // • Allows the assigned veterinarian to schedule
    //   a pending appointment request.
    // • Validates the appointment date and duration.
    // • Prevents conflicts with other scheduled
    //   appointments for the same veterinarian.
    // ==================================================

    const vetId = req.user.id;
    const { appointmentDate, duration, vetNotes } = req.body;

    const appointment = await VetAppointment.findById(
      req.params.id,
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ensure the appointment belongs to the current vet.
    if (appointment.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to schedule this appointment",
      });
    }

    // Only pending requests can be scheduled.
    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be scheduled",
      });
    }

    const startDate = new Date(appointmentDate);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date",
      });
    }

    if (startDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Appointment date must be in the future",
      });
    }

    const appointmentDuration = Number(duration) || 30;

    if (
      appointmentDuration < 15 ||
      appointmentDuration > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 15 and 180 minutes",
      });
    }

    const newAppointmentEnd = new Date(
      startDate.getTime() +
        appointmentDuration * 60 * 1000,
    );

    // Retrieve scheduled appointments that may overlap
    // with the requested time range.
    const scheduledAppointments =
      await VetAppointment.find({
        _id: {
          $ne: appointment._id,
        },
        vetId,
        status: "scheduled",
        appointmentDate: {
          $lt: newAppointmentEnd,
        },
      });

    const hasConflict = scheduledAppointments.some(
      (currentAppointment) => {
        const currentStart = new Date(
          currentAppointment.appointmentDate,
        );

        const currentEnd = new Date(
          currentStart.getTime() +
            currentAppointment.duration * 60 * 1000,
        );

        return currentEnd > startDate;
      },
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message:
          "The vet already has another appointment during this time",
      });
    }

    appointment.appointmentDate = startDate;
    appointment.duration = appointmentDuration;
    appointment.status = "scheduled";

    if (vetNotes !== undefined) {
      appointment.vetNotes = vetNotes;
    }

    await appointment.save();

    const data = await VetAppointment.findById(
      appointment._id,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      );

    return res.status(200).json({
      success: true,
      message: "Appointment scheduled successfully",
      data,
    });
  };

  // ==================================================
  // Update Appointment Status
  // ==================================================
  updateStatus = async (req, res) => {
    // • Allows the assigned veterinarian to complete
    //   or reject a scheduled appointment.
    // • Requires a rejection reason when the appointment
    //   is rejected.
    // • Stores optional veterinarian notes.
    // ==================================================

    const vetId = req.user.id;
    const { status, vetNotes, rejectionReason } = req.body;

    const appointment = await VetAppointment.findById(
      req.params.id,
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ensure the appointment belongs to the current vet.
    if (appointment.vetId.toString() !== vetId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this appointment",
      });
    }

    // Only scheduled appointments can be completed
    // or rejected.
    if (appointment.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Only scheduled appointments can be updated",
      });
    }

    if (!["completed", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be completed or rejected",
      });
    }

    if (
      status === "rejected" &&
      (!rejectionReason || !rejectionReason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required when rejecting an appointment",
      });
    }

    appointment.status = status;

    if (vetNotes !== undefined) {
      appointment.vetNotes = vetNotes;
    }

    if (status === "completed") {
      appointment.completedAt = new Date();
      appointment.rejectionReason = null;
    }

    if (status === "rejected") {
      appointment.rejectionReason =
        rejectionReason.trim();
    }

    await appointment.save();

    const data = await VetAppointment.findById(
      appointment._id,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      );

    return res.status(200).json({
      success: true,
      message:
        status === "completed"
          ? "Appointment completed successfully"
          : "Appointment rejected successfully",
      data,
    });
  };

  // ==================================================
  // Cancel an Appointment
  // ==================================================
  cancel = async (req, res) => {
    // • Allows the adopter to cancel their own pending
    //   or scheduled appointment.
    // • Prevents cancelling completed, rejected, or
    //   previously cancelled appointments.
    // • Records the cancellation timestamp.
    // ==================================================

    const adopterId = req.user.id;

    const appointment = await VetAppointment.findById(
      req.params.id,
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ensure the appointment belongs to the
    // current adopter.
    if (
      appointment.adopterId.toString() !==
      adopterId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this appointment",
      });
    }

    if (
      !["pending", "scheduled"].includes(
        appointment.status,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be cancelled",
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledAt = new Date();

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  };

  // ==================================================
  // Get Appointment By ID
  // ==================================================
  getById = async (req, res) => {
    // • Retrieves one appointment by its ID.
    // • Allows access only to the appointment adopter,
    //   assigned veterinarian, or Super Admin.
    // • Returns adopter and veterinarian information.
    // ==================================================

    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await VetAppointment.findById(
      req.params.id,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const isAdopterOwner =
      appointment.adopterId._id.toString() ===
      userId.toString();

    const isVetOwner =
      appointment.vetId._id.toString() ===
      userId.toString();

    const isSuperAdmin = userRole === "superadmin";

    // Restrict access to appointment participants
    // and the Super Admin.
    if (
      !isAdopterOwner &&
      !isVetOwner &&
      !isSuperAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this appointment",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  };

  // ==================================================
  // Get All Vet Appointments
  // ==================================================
  getAll = async (req, res) => {
    // • Retrieves all veterinarian appointments.
    // • Supports filtering by status, veterinarian,
    //   or adopter.
    // • Access should be restricted to Super Admin
    //   through the route middleware.
    // ==================================================

    const { status, vetId, adopterId } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (vetId) {
      filter.vetId = vetId;
    }

    if (adopterId) {
      filter.adopterId = adopterId;
    }

    const appointments = await VetAppointment.find(
      filter,
    )
      .populate(
        "adopterId",
        "firstName lastName email phone profileImage",
      )
      .populate(
        "vetId",
        "firstName lastName email phone profileImage",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  };
}

module.exports = new VetAppointmentController();