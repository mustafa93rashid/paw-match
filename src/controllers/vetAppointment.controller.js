// controllers/vetAppointment.controller.js
const VetAppointment = require("../models/vetAppointment");

class VetAppointmentController { 
  
  // 1. طلب موعد (للـ Adopter)
  request = async (req, res) => {
    const { vetId, appointmentDate, notes } = req.body;
    
    // التحقق من التاريخ
    if (new Date(appointmentDate) < new Date()) {
      return res.status(400).json({ success: false, message: "Date must be in the future" });
    }

    const appointment = await VetAppointment.create({
      adopterId: req.user._id,
      vetId,
      appointmentDate,
      notes
    });

    // إرجاع البيانات مع تفاصيل إضافية (اختياري)
    const data = await VetAppointment.findById(appointment._id).populate("adopterId vetId", "name email");

    res.status(201).json({ success: true, data });
  };

  // 2. تحديث حالة الموعد والملاحظات (للطبيب)
  updateStatus = async (req, res) => {
    const { status, notes } = req.body;
    
    // التحقق من الحالة إذا تم إرسالها
    if (status && !["scheduled", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const appointment = await VetAppointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }


    // تحديث البيانات
    appointment.status = status || appointment.status;
    appointment.notes = notes !== undefined ? notes : appointment.notes;
    await appointment.save();

    // إرجاع البيانات المحدثة مع الـ Populated Data
    const updatedData = await appointment.populate("adopterId vetId", "name email");

    res.status(200).json({ success: true, data: updatedData });
  };
}

module.exports = new VetAppointmentController();