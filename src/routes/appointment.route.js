const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointment.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

// 1. إنشاء موعد (للـ Shelter Employee فقط)
router.post("/", [auth, role(["shelterEmployee", "superadmin"])],asyncHandler(controller.create));

// 2. عرض جميع المواعيد (Super Admin فقط)
router.get("/all", [auth, role(["superadmin"])], asyncHandler(controller.getAll));

// 3. عرض مواعيد الملجأ الخاص (Shelter Employee)
router.get("/shelter",  [auth, role(["shelterEmployee", "superadmin"])],asyncHandler( controller.getByShelter));

// 4. عرض مواعيد المتبني (Adopter)
router.get("/my-appointments", [auth, role(["adopter", "superadmin"])], asyncHandler(controller.getMyAppointments));

// 5. عرض تفاصيل موعد (للجميع - مع التحقق من الصلاحية داخل الـ Controller)
router.get("/:id", [auth], asyncHandler(controller.getDetails));

// 6. تأكيد الموعد (Shelter Employee)
router.patch("/:id/confirm",  [auth, role(["shelterEmployee", "superadmin"])],asyncHandler( controller.confirm));

// 7. إعادة جدولة الموعد (Shelter Employee)
router.patch("/:id/reschedule", [auth, role(["shelterEmployee", "superadmin"])],asyncHandler( controller.reschedule));

// 8. إلغاء الموعد (Shelter Employee أو Adopter)
router.patch("/:id/cancel", [auth], asyncHandler(controller.cancel));

// 9. إنهاء الموعد (Shelter Employee)
router.patch("/:id/finish", [auth ,role(["shelterEmployee", "superadmin"])],asyncHandler( controller.finish));

// 10. تسجيل عدم حضور المتبني (Shelter Employee)
router.patch("/:id/no-show", [auth, role(["shelterEmployee", "superadmin"])],asyncHandler( controller.noShow));

// 11. تحديث ملاحظات الموعد (Shelter Employee)
router.patch("/:id/notes",  [auth, role(["shelterEmployee", "superadmin"])],asyncHandler( controller.updateNotes));

module.exports = router;