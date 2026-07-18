const Review = require("../models/Review");
const AdoptionRequest = require("../models/AdoptionRequest");
const Appointment = require("../models/Appointment"); // 
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    إنشاء تقييم جديد (مع التحقق الصارم من شرط Approved)
 * @route   POST /api/v1/reviews
 * @access  Private (Adopter Only)
 */
exports.createReview = asyncHandler(async (req, res, next) => {
  const { targetType, targetId, transactionId, rating, comment } = req.body;
  const adopterId = req.user._id; // يأتي من middleware المصادقة auth.js

  // 1. فحص الأهلية الصارم بناءً على نوع المستهدف
  if (targetType === "Shelter") {
    // التحقق من وجود طلب تبني موافق عليه (Approved) يربط المتبني بالملجأ
    const validRequest = await AdoptionRequest.findOne({
      _id: transactionId,
      adopterId: adopterId,
      shelterId: targetId,
      status: "Approved" // الشرط الإلزامي والحصري الذي طلبته
    });

    if (!validRequest) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالتقييم؛ يجب أن تمتلك طلب تبني تمت الموافقة عليه (Approved) من هذا الملجأ أولاً."
      });
    }
  } else if (targetType === "Vet") {
    // التحقق من وجود موعد طبي مكتمل أو موافق عليه
    const validAppointment = await Appointment.findOne({
      _id: transactionId,
      userId: adopterId, // أو adopterId حسب تصميم جدول المواعيد
      vetId: targetId,
      status: { $in: ["Approved", "Completed"] }
    });

    if (!validAppointment) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بالتقييم؛ يجب اكتمال موعدك الطبي أولاً."
      });
    }
  }

  // 2. محاولة إنشاء التقييم (فهرس Mongoose سيمنع التكرار تلقائياً إذا حاول نفس الشخص إعادة إرساله)
  try {
    const review = await Review.create({
      adopterId,
      targetType,
      targetId,
      transactionId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: "تم إضافة تقييمك بنجاح وتحديث متوسط التقييمات",
      data: review
    });
  } catch (error) {
    // التقاط خطأ التكرار من قاعدة البيانات (Error Code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "لقد قمت بتقييم هذه العملية مسبقاً، لا يمكنك تكرار التقييم لنفس المعاملة."
      });
    }
    throw error;
  }
});

/**
 * @desc    تعديل التقييم (مسموح خلال 48 ساعة فقط من الإنشاء)
 * @route   PUT /api/v1/reviews/:id
 * @access  Private (Adopter Only - صاحب التقييم)
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: "التقييم غير موجود" });
  }

  // التأكد أن من يحاول التعديل هو صاحب التقييم نفسه
  if (review.adopterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "غير مصرح لك بتعديل هذا التقييم" });
  }

  // فحص شرط نافذة الـ 48 ساعة
  const hoursPassed = (Date.now() - review.createdAt) / (1000 * 60 * 60);
  if (hoursPassed > 48) {
    return res.status(400).json({
      success: false,
      message: "انتهت المهلة المسموحة لتعديل التقييم (48 ساعة من تاريخ الإنشاء)."
    });
  }

  // تحديث البيانات
  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;
  review.isEdited = true;

  await review.save(); // يتم استدعاء post('save') لإعادة حساب المتوسط

  res.status(200).json({
    success: true,
    message: "تم تعديل التقييم بنجاح",
    data: review
  });
});

/**
 * @desc    إضافة رد رسمي من الملجأ أو الطبيب (رد واحد فقط)
 * @route   PUT /api/v1/reviews/:id/reply
 * @access  Private (Shelter / Vet Only)
 */
exports.addReply = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ success: false, message: "التقييم غير موجود" });
  }

  // فحص عدم وجود رد سابق (شرط الرد الرسمي الوحيد)
  if (review.reply && review.reply.text) {
    return res.status(400).json({
      success: false,
      message: "لقد قمت بالرد على هذا التقييم مسبقاً. يُسمح برد رسمي واحد فقط."
    });
  }

  // حفظ الرد
  review.reply = {
    text,
    createdAt: Date.now()
  };

  await review.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "تم إضافة ردك الرسمي بنجاح",
    data: review
  });
});

/**
 * @desc    جلب جميع تقييمات ملجأ أو طبيب معين
 * @route   GET /api/v1/reviews/target/:targetId
 * @access  Public
 */
exports.getTargetReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({
    targetId: req.params.targetId,
    status: "Published"
  })
    .populate("adopterId", "name avatar") // جلب اسم وصورة المتبني فقط
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});