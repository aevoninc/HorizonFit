import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import HabitGuide, { HABIT_CODE_LIST } from "../model/habitGuide.model.js";
import HabitLog from "../model/habitLog.model.js";
import User from "../model/user.model.js";
import PatientZoneProgress from "../model/normalPlanModels/patientZoneProgress.model.js";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── PATIENT CONTROLLERS ────────────────────────────────────────────────────

/**
 * GET /api/v1/patients/program-status
 */
export const getProgramStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("currentZone currentDay");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, {
    currentZone: user.currentZone,
    currentDay: user.currentDay,
    totalDaysInZone: 21, // Each zone is currently 21 days
    started: true
  }, "Program status fetched"));
});

/**
 * GET /api/v1/patients/habits/today
 */
export const getTodayHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const todayStart = startOfDay(new Date());

  const log = await HabitLog.findOne({ patientId, date: todayStart });

  const habits = HABIT_CODE_LIST.map((code) => ({
    habitCode: code,
    completed: log ? log.completedHabits.includes(code) : false,
  }));

  return res.status(200).json(new ApiResponse(200, { habits, submitted: !!log }, "Today's habits fetched"));
});

/**
 * POST /api/v1/patients/habits/submit
 * Body: { completedHabits: ["Hydration", "Exercise", ...] }
 */
export const submitHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { completedHabits, notes, mood } = req.body;

  if (!Array.isArray(completedHabits)) {
    throw new ApiError(400, "completedHabits must be an array");
  }

  // Validate habit codes
  const validHabits = completedHabits.filter((h) => HABIT_CODE_LIST.includes(h));

  const user = await User.findById(patientId);
  if (!user) throw new ApiError(404, "User not found");

  const todayStart = startOfDay(new Date());

  // Prevent duplicate submissions for the same calendar date
  const existing = await HabitLog.findOne({ patientId, date: todayStart });
  if (existing) {
    throw new ApiError(400, "You have already submitted your habits for today.");
  }

  // Create HabitLog using current user state
  const log = await HabitLog.create({
    patientId,
    zone: user.currentZone,
    day: user.currentDay,
    date: todayStart,
    completedHabits: validHabits,
    notes: notes || "",
    mood: mood || "good",
  });

  // Zone Progression Logic
  let nextDay = user.currentDay + 1;
  let nextZone = user.currentZone;

  if (nextDay > 21) {
    nextDay = 1;
    nextZone = Math.min(user.currentZone + 1, 5);

    // If transitioning to a new zone, ensure PatientZoneProgress is updated
    if (nextZone > user.currentZone) {
      await PatientZoneProgress.findOneAndUpdate(
        { patientId, zoneNumber: nextZone },
        { isUnlocked: true, startedAt: new Date() },
        { upsert: true, new: true }
      );

      // Mark current zone as completed
      await PatientZoneProgress.findOneAndUpdate(
        { patientId, zoneNumber: user.currentZone },
        { isCompleted: true, completedAt: new Date() }
      );
    }
  }

  user.currentDay = nextDay;
  user.currentZone = nextZone;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { log, user: { currentZone: user.currentZone, currentDay: user.currentDay } }, "Habits submitted successfully"));
});

/**
 * GET /api/v1/patients/habits/history
 */
export const getHabitHistory = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const logs = await HabitLog.find({ patientId }).sort({ date: -1 });
  return res.status(200).json(new ApiResponse(200, { logs }, "Habit history fetched"));
});

/**
 * GET /api/v1/patients/habits/:habitCode/guide
 */
export const getHabitGuide = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { habitCode } = req.params;
  const { zone } = req.query;

  if (!HABIT_CODE_LIST.includes(habitCode)) {
    throw new ApiError(400, "Invalid habitCode");
  }

  const user = await User.findById(patientId).select("programStartDate currentZone");

  // ✅ declare currentZone outside the if block so it's always in scope
  const currentZone = user?.currentZone;
  const targetZone = zone ? Number(zone) : currentZone;
  const pId = new mongoose.Types.ObjectId(patientId.toString());
  const guide = await HabitGuide.findOne({
    habitCode: { $regex: new RegExp(`^${habitCode}$`, 'i') },
    zone: targetZone,
    patientId: pId
  });
  if (!guide) {
    return res.status(200).json({
      success: true,
      guide: null,
      message: "Your guide will be available soon."
    });
  }

  return res.status(200).json({
    success: true,
    guide,
    zone: currentZone, // ✅ now accessible
    message: "Habit guide fetched"
  });
});

// ─── DOCTOR CONTROLLERS ─────────────────────────────────────────────────────

/**
 * POST /api/v1/doctor/habit-guide
 * Upsert guide for { zone, habitCode, patientId }
 */
export const assignHabitGuide = asyncHandler(async (req, res) => {
  const { habitCode, zone, content, patientId } = req.body;

  if (!habitCode || !HABIT_CODE_LIST.includes(habitCode)) {
    throw new ApiError(400, "Invalid or missing habitCode");
  }
  if (!zone || zone < 1 || zone > 5) {
    throw new ApiError(400, "Zone must be between 1 and 5");
  }
  if (!content || !content.trim()) {
    throw new ApiError(400, "Guide content is required");
  }

  if (!patientId) {
    throw new ApiError(400, "patientId is required");
  }

  const filter = {
    habitCode,
    zone: Number(zone),
    patientId: new mongoose.Types.ObjectId(patientId),
  };

  const guide = await HabitGuide.findOneAndUpdate(
    filter,
    { ...filter, content: content.trim() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json({
    success: true,
    guide,
    message: "Habit guide assigned successfully"
  });
});

/**
 * GET /api/v1/doctor/habit-guide
 */
export const getHabitGuides = asyncHandler(async (req, res) => {
  const { patientId } = req.query;

  if (!patientId) {
    throw new ApiError(400, "patientId is required");
  }

  const guides = await HabitGuide.find({ patientId })
    .sort({ zone: 1, habitCode: 1 });
  return res.status(200).json({
    success: true,
    guides,
    message: "Habit guides fetched"
  });
});

/**
 * PATCH /api/v1/doctor/habit-guide/:id
 */
export const updateHabitGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content is required");
  }

  const guide = await HabitGuide.findByIdAndUpdate(
    id,
    { content: content.trim() },
    { new: true }
  );

  if (!guide) throw new ApiError(404, "Guide not found");

  return res.status(200).json({
    success: true,
    guide: guide,
    message: "Habit guide updated"
  });
});

/**
 * DELETE /api/v1/doctor/habit-guide/:id
 */
export const deleteHabitGuide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const guide = await HabitGuide.findByIdAndDelete(id);
  if (!guide) throw new ApiError(404, "Guide not found");
  return res.status(200).json({
    success: true,
    message: "Habit guide deleted"
  });
});
