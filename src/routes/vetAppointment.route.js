const express = require("express");
const router = express.Router();
const controller = require("../controllers/vetAppointment.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");


// للـ Adopter: طلب موعد
router.post("/", [auth, role(["adopter"])], asyncHandler(controller.request));

// للطبيب: تحديث الحالة أو الملاحظات
router.patch("/:id", [auth, role(["vet"])], asyncHandler(controller.updateStatus));

module.exports = router;