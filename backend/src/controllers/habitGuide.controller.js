import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import HabitGuide, { HABIT_CODE_LIST } from "../model/habitGuide.model.js";
import HabitLog from "../model/habitLog.model.js";
import User from "../model/user.model.js";
import PatientZoneProgress from "../model/normalPlanModels/patientZoneProgress.model.js";
import WeeklyLog from "../model/normalPlanModels/weeklyLog.model.js";

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
  const user = await User.findById(req.user._id).select("currentZone currentDay programCompleted status");
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, {
    currentZone: user.currentZone,
    currentDay: user.currentDay,
    totalDaysInZone: 21, // Each zone is currently 21 days
    programCompleted: user.programCompleted || user.status === "completed" || false,
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

  const habits = HABIT_CODE_LIST.map((code) => {
    const detail = log?.habitDetails?.find((d) => d.habitCode === code);
    return {
      habitCode: code,
      completed: log ? log.completedHabits.includes(code) : false,
      completedTasks: detail ? detail.completedTasks : [],
      mainTicked: detail ? detail.mainTicked : false,
    };
  });

  return res.status(200).json(new ApiResponse(200, { habits, submitted: !!log }, "Today's habits fetched"));
});

/**
 * POST /api/v1/patients/habits/submit
 * Body: { completedHabits: ["Hydration", "Exercise", ...] }
 */
export const submitHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { completedHabits, habitDetails, notes, mood } = req.body;

  const user = await User.findById(patientId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.programCompleted || user.status === "completed") {
    throw new ApiError(400, "🎉 Program Completed! You have completed all 15 weeks of the HorizonFit program and cannot submit further daily habits.");
  }

  // GATING: Verify user has submitted required weekly logs before proceeding with daily habits
  const logsInCurrentZone = await WeeklyLog.countDocuments({
    patientId,
    zoneNumber: user.currentZone,
  });

  if (user.currentDay >= 8 && user.currentDay <= 14 && logsInCurrentZone < 1) {
    throw new ApiError(
      400,
      `Please complete your Week 1 log for Zone ${user.currentZone} to proceed with your daily habits.`
    );
  }

  if (user.currentDay >= 15 && user.currentDay <= 21 && logsInCurrentZone < 2) {
    throw new ApiError(
      400,
      `Please complete your Week 2 log for Zone ${user.currentZone} to proceed with your daily habits.`
    );
  }

  if (user.currentZone > 1 && user.currentDay === 1) {
    const logsInPrevZone = await WeeklyLog.countDocuments({
      patientId,
      zoneNumber: user.currentZone - 1,
    });
    if (logsInPrevZone < 3) {
      throw new ApiError(
        400,
        `Please complete your Week 3 log for Zone ${user.currentZone - 1} to proceed to Zone ${user.currentZone}.`
      );
    }
  }

  const todayStart = startOfDay(new Date());

  // // Prevent duplicate submissions for the same calendar date
  const existing = await HabitLog.findOne({ patientId, date: todayStart });
  if (existing) {
    throw new ApiError(400, "You have already submitted your habits for today.");
  }

  // Determine fully completed habits based on habitDetails if provided
  let finalCompletedHabits = Array.isArray(completedHabits) ? completedHabits : [];
  let finalHabitDetails = Array.isArray(habitDetails) ? habitDetails : [];

  if (finalHabitDetails.length > 0) {
    // Fetch guides for current zone to verify task completion
    const guides = await HabitGuide.find({
      patientId,
      zone: user.currentZone,
    });

    const calculatedCompletedHabits = [];
    for (const detail of finalHabitDetails) {
      const guide = guides.find((g) => g.habitCode === detail.habitCode);
      if (guide) {
        const totalTasks = guide.tasks.length;
        const doneTasks = detail.completedTasks.length;

        // Full completion = all tasks ticked
        if (totalTasks > 0 && doneTasks === totalTasks) {
          calculatedCompletedHabits.push(detail.habitCode);
        }
      } else {
        // If no guide exists, we might rely on the main checkbox or legacy behavior
        if (detail.mainTicked) {
          // This is a bit ambiguous if no guide exists, but let's assume it doesn't count as "Full" unless tasks are defined and done
          // However, if the user explicitly sent it in completedHabits, we keep it.
        }
      }
    }

    // Merge calculated with explicitly provided (legacy)
    finalCompletedHabits = [...new Set([...finalCompletedHabits, ...calculatedCompletedHabits])];
  }

  // Validate habit codes
  const validHabits = finalCompletedHabits.filter((h) => HABIT_CODE_LIST.includes(h));

  // Create HabitLog
  const log = await HabitLog.create({
    patientId,
    zone: user.currentZone,
    day: user.currentDay,
    date: todayStart,
    completedHabits: validHabits,
    habitDetails: finalHabitDetails,
    notes: notes || "",
    mood: mood || "good",
  });

  // Zone Progression Logic
  let nextDay = user.currentDay + 1;
  let nextZone = user.currentZone;
  let programCompleted = user.programCompleted || false;

  if (nextDay > 21) {
    if (user.currentZone < 5) {
      nextDay = 1;
      nextZone = user.currentZone + 1;

      // Mark current zone as completed and unlock next zone
      await PatientZoneProgress.findOneAndUpdate(
        { patientId, zoneNumber: user.currentZone },
        { isCompleted: true, completedAt: new Date() }
      );
      await PatientZoneProgress.findOneAndUpdate(
        { patientId, zoneNumber: nextZone },
        { isUnlocked: true, startedAt: new Date() },
        { upsert: true, new: true }
      );
    } else {
      // Completed Zone 5 Day 21 - Program Completed!
      nextDay = 21;
      programCompleted = true;
      await PatientZoneProgress.findOneAndUpdate(
        { patientId, zoneNumber: 5 },
        { isCompleted: true, completedAt: new Date() }
      );
    }
  }

  user.currentDay = nextDay;
  user.currentZone = nextZone;
  if (programCompleted) {
    user.programCompleted = true;
    user.status = "completed";
  }
  await user.save();

  const isUpgrade = nextZone > user.currentZone;
  let message = "Habits submitted successfully";
  if (programCompleted) {
    message = "🎉 Congratulations! You have successfully completed the entire 15-week HorizonFit Program!";
  } else if (isUpgrade) {
    message = `🎉 Congratulations! You have completed Zone ${user.currentZone}! You are now promoted to Zone ${nextZone}!`;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { log, user: { currentZone: user.currentZone, currentDay: user.currentDay, programCompleted } }, message));
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
  const { habitCode, zone, content, patientId, tasks } = req.body;

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

  // Validate tasks if provided
  let validatedTasks = [];
  if (tasks && Array.isArray(tasks)) {
    validatedTasks = tasks
      .filter((t) => t.taskName && t.taskName.trim())
      .map((t) => ({ taskName: t.taskName.trim() }));
  }

  const filter = {
    habitCode,
    zone: Number(zone),
    patientId: new mongoose.Types.ObjectId(patientId),
  };

  const guide = await HabitGuide.findOneAndUpdate(
    filter,
    { ...filter, content: content.trim(), tasks: validatedTasks },
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
