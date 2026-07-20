// controllers/appointment.controller.js
const Appointment = require("../models/appointment");
const AdoptionRequest = require("../models/adoptionRequest");

class AppointmentController {
  // 1.إنشاء موعد
  create = async (req, res) => {
    const { adoptionRequestId, startTime, duration, shelterId } = req.body;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    const request = await AdoptionRequest.findById(adoptionRequestId);
    if (!request)
      return res.status(404).json({ message: "Adoption request not found" });

    // منع تكرار موعد نشط لنفس الطلب
    const active = await Appointment.findOne({
      adoptionRequestId,
      status: { $nin: ["cancelled", "completed", "noShow"] },
    });
    if (active)
      return res
        .status(400)
        .json({ message: "Active appointment already exists" });

    // التحقق من تعارض الوقت في نفس الملجأ
    const conflict = await Appointment.findOne({
      shelterId,
      status: { $nin: ["cancelled", "completed", "noShow"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict)
      return res.status(400).json({ message: "Time slot is already booked" });

    if (start < new Date())
      return res.status(400).json({ message: "Date must be in the future" });

    const appointment = await Appointment.create({
      ...req.body,
      startTime: start,
      endTime: end,
      createdBy: req.user._id,
    });

    await AdoptionRequest.findByIdAndUpdate(adoptionRequestId, {
      status: "interview",
    });
    res.status(201).json({ success: true, data: appointment });
  };

  // 2. عرض المواعيد
  getAll = async (req, res) => {
    const appointments = await Appointment.find();
    res.status(200).json({ success: true, data: appointments });
  };

  getByShelter = async (req, res) => {
    const appointments = await Appointment.find({
      shelterId: req.user.shelterId,
    });
    res.status(200).json({ success: true, data: appointments });
  };

  getMyAppointments = async (req, res) => {
    const appointments = await Appointment.find({ adopterId: req.user._id });
    res.status(200).json({ success: true, data: appointments });
  };

  getDetails = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true, data: appointment });
  };

  // 3. تأكيد الموعد
  confirm = async (req, res) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "confirmed" },
      { new: true },
    );
    res.status(200).json({ success: true, data: appointment });
  };

  // 4. إنهاء الموعد
  finish = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || appointment.status !== "confirmed")
      return res
        .status(400)
        .json({ message: "Only confirmed appointments can be finished" });

    appointment.status = "completed";
    appointment.completedAt = new Date();
    await appointment.save();
    res.status(200).json({ success: true, data: appointment });
  };

  // 5. إلغاء الموعد
  cancel = async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Not found" });

    appointment.status = "cancelled";
    await appointment.save();
    await AdoptionRequest.findByIdAndUpdate(appointment.adoptionRequestId, {
      status: "pendingReview",
    });
    res.status(200).json({ success: true, data: appointment });
  };

  // 6. تسجيل عدم حضور المتبني
  noShow = async (req, res) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "noShow" },
      { new: true },
    );
    await AdoptionRequest.findByIdAndUpdate(appointment.adoptionRequestId, {
      status: "pendingReview",
    });
    res.status(200).json({ success: true, data: appointment });
  };
  // 7. تحديث الملاحظات
  updateNotes = async (req, res) => {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { notes: req.body.notes },
      { new: true },
    );
    res.status(200).json({ success: true, data: appointment });
  };
}

module.exports = new AppointmentController();
