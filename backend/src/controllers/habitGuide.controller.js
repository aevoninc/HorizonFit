import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import HabitGuide, { HABIT_CODE_LIST } from "../model/habitGuide.model.js";
import HabitLog from "../model/habitLog.model.js";
import User from "../model/user.model.js";
import {
  dateKeyToUtcDate,
  getDateKey,
  getHabitLogDateKey,
  getProgramCalendar,
  isValidTimeZone,
} from "../utils/programCalendar.js";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getPatientTimeZone(req, savedTimeZone) {
  const requestedTimeZone = req.query.timeZone || (req.body && req.body.timeZone);
  if (requestedTimeZone && !isValidTimeZone(requestedTimeZone)) {
    throw new ApiError(400, "Invalid program timezone");
  }
  return savedTimeZone || requestedTimeZone || "UTC";
}

async function findHabitLogForDate(patientId, date, timeZone) {
  const start = dateKeyToUtcDate(date);
  const legacyStart = new Date(start);
  legacyStart.setUTCDate(legacyStart.getUTCDate() - 1);
  const legacyEnd = new Date(start);
  legacyEnd.setUTCDate(legacyEnd.getUTCDate() + 2);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const candidates = await HabitLog.find({
    patientId,
    $or: [
      { scheduledDate: { $gte: start, $lt: end } },
      { scheduledDate: null, date: { $gte: legacyStart, $lt: legacyEnd } },
    ],
  });
  return candidates.find((log) => getHabitLogDateKey(log, timeZone) === date) || null;
}

// ─── PATIENT CONTROLLERS ────────────────────────────────────────────────────

/**
 * GET /api/v1/patients/program-status
 */
export const getProgramStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("currentZone currentDay programStartDate programTimeZone programCompleted status");
  if (!user) throw new ApiError(404, "User not found");

  const requestedTimeZone = req.query.timeZone;
  if (requestedTimeZone && !isValidTimeZone(requestedTimeZone)) {
    throw new ApiError(400, "Invalid program timezone");
  }
  if (!user.programTimeZone && requestedTimeZone) {
    user.programTimeZone = requestedTimeZone;
    await user.save();
  }
  const timeZone = getPatientTimeZone(req, user.programTimeZone);
  const firstCalendar = getProgramCalendar(user.programStartDate, [], new Date(), timeZone);
  const logStartDate = firstCalendar.startDate
    ? dateKeyToUtcDate(firstCalendar.startDate)
    : null;
  if (logStartDate) logStartDate.setUTCDate(logStartDate.getUTCDate() - 1);
  const logs = user.programStartDate
    ? await HabitLog.find({
      patientId: user._id,
      date: { $gte: logStartDate },
    }).select("date scheduledDate createdAt")
    : [];
  const calendar = getProgramCalendar(user.programStartDate, logs, new Date(), timeZone);

  return res.status(200).json(new ApiResponse(200, {
    ...calendar,
    currentZone: calendar.currentZone || user.currentZone,
    currentDay: calendar.currentDay || user.currentDay,
    totalDaysInZone: 21, // Each zone is currently 21 days
    programCompleted: user.programCompleted || user.status === "completed" || false,
  }, "Program status fetched"));
});

/**
 * GET /api/v1/patients/habits/today
 */
export const getTodayHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const user = await User.findById(patientId).select("programTimeZone");
  if (!user) throw new ApiError(404, "User not found");
  const timeZone = getPatientTimeZone(req, user.programTimeZone);
  const todayDate = getDateKey(new Date(), timeZone);
  const requestedDate = req.query.date || todayDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ||
      getDateKey(dateKeyToUtcDate(requestedDate), "UTC") !== requestedDate) {
    throw new ApiError(400, "Invalid session date");
  }
  const todayStart = dateKeyToUtcDate(todayDate);
  const targetStart = dateKeyToUtcDate(requestedDate);
  if (targetStart > todayStart) {
    throw new ApiError(400, "Future sessions are not available");
  }

  const log = await findHabitLogForDate(patientId, requestedDate, timeZone);

  const habits = HABIT_CODE_LIST.map((code) => {
    const detail = log?.habitDetails?.find((d) => d.habitCode === code);
    return {
      habitCode: code,
      completed: log ? log.completedHabits.includes(code) : false,
      completedTasks: detail ? detail.completedTasks : [],
      mainTicked: detail ? detail.mainTicked : false,
    };
  });

  return res.status(200).json(new ApiResponse(200, {
    habits,
    submitted: !!log,
    sessionDate: requestedDate,
    isHistorical: requestedDate !== todayDate,
  }, "Daily habits fetched"));
});

/**
 * POST /api/v1/patients/habits/submit
 * Body: { completedHabits: ["Hydration", "Exercise", ...] }
 */
export const submitHabits = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { completedHabits, habitDetails, notes, mood, scheduledDate } = req.body;

  const user = await User.findById(patientId);
  if (!user) throw new ApiError(404, "User not found");
  const timeZone = getPatientTimeZone(req, user.programTimeZone);
  if (!user.programTimeZone) user.programTimeZone = timeZone;

  // GATING: Verify user has submitted required weekly logs before proceeding with daily habits
  // const logsInCurrentZone = await WeeklyLog.countDocuments({
  //   patientId,
  //   zoneNumber: user.currentZone,
  // });

  // if (user.currentDay >= 8 && user.currentDay <= 14 && logsInCurrentZone < 1) {
  //   throw new ApiError(
  //     400,
  //     `Please complete your Week 1 log for Zone ${user.currentZone} to proceed with your daily habits.`
  //   );
  // }

  // if (user.currentDay >= 15 && user.currentDay <= 21 && logsInCurrentZone < 2) {
  //   throw new ApiError(
  //     400,
  //     `Please complete your Week 2 log for Zone ${user.currentZone} to proceed with your daily habits.`
  //   );
  // }

  // if (user.currentZone > 1 && user.currentDay === 1) {
  //   const logsInPrevZone = await WeeklyLog.countDocuments({
  //     patientId,
  //     zoneNumber: user.currentZone - 1,
  //   });
  //   if (logsInPrevZone < 3) {
  //     throw new ApiError(
  //       400,
  //       `Please complete your Week 3 log for Zone ${user.currentZone - 1} to proceed to Zone ${user.currentZone}.`
  //     );
  //   }
  // }

  const todayDate = getDateKey(new Date(), timeZone);
  const targetDate = scheduledDate || todayDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
      getDateKey(dateKeyToUtcDate(targetDate), "UTC") !== targetDate) {
    throw new ApiError(400, "Invalid session date");
  }
  const targetStart = dateKeyToUtcDate(targetDate);
  if (targetStart > dateKeyToUtcDate(todayDate)) {
    throw new ApiError(400, "Future sessions cannot be submitted");
  }
  if ((user.programCompleted || user.status === "completed") && targetDate === todayDate) {
    throw new ApiError(400, "Your program is complete. Only missed historical sessions can be recorded.");
  }
  const previousZone = user.currentZone;
  const calendar = getProgramCalendar(user.programStartDate, [], new Date(), timeZone);
  const targetCalendar = getProgramCalendar(
    user.programStartDate,
    [],
    targetDate,
    timeZone,
  );
  if (
    !targetCalendar.started ||
    targetCalendar.scheduleComplete ||
    targetCalendar.programDayNumber > (calendar.programDayNumber || 0)
  ) {
    throw new ApiError(400, "This date is outside your program schedule");
  }
  if (targetDate === todayDate && calendar.scheduleComplete) {
    throw new ApiError(400, "Your program schedule has ended. Please contact your doctor for next steps.");
  }
  const scheduledZone = targetCalendar.currentZone || user.currentZone;
  const scheduledDay = targetCalendar.currentDay || user.currentDay;

  const existing = await findHabitLogForDate(patientId, targetDate, timeZone);
  if (existing) {
    throw new ApiError(400, "This daily session has already been submitted.");
  }

  // Determine fully completed habits based on habitDetails if provided
  let finalCompletedHabits = Array.isArray(completedHabits) ? completedHabits : [];
  let finalHabitDetails = Array.isArray(habitDetails) ? habitDetails : [];

  if (finalHabitDetails.length > 0) {
    // Fetch guides for current zone to verify task completion
    const guides = await HabitGuide.find({
      patientId,
      zone: scheduledZone,
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
    zone: scheduledZone,
    day: scheduledDay,
    date: targetStart,
    scheduledDate: targetStart,
    completedHabits: validHabits,
    habitDetails: finalHabitDetails,
    notes: notes || "",
    mood: mood || "good",
  });

  if (targetDate === todayDate) {
    user.currentDay = scheduledDay;
    user.currentZone = scheduledZone;
    await user.save();
  }

  let message = "Habits submitted successfully";
  if (targetDate !== todayDate) {
    message = `Missed session for ${targetDate} saved. Your current program day has not changed.`;
  } else if (scheduledZone > previousZone) {
    message = `You are now on Zone ${scheduledZone}, Day ${scheduledDay}.`;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {
      log,
      user: {
        currentZone: user.currentZone,
        currentDay: user.currentDay,
        programCompleted: user.programCompleted,
      },
      schedule: calendar,
    }, message));
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

  const user = await User.findById(patientId).select("programStartDate programTimeZone currentZone currentDay");

  // ✅ declare currentZone outside the if block so it's always in scope
  const calendar = getProgramCalendar(user?.programStartDate, [], new Date(), user?.programTimeZone || "UTC");
  const currentZone = calendar.currentZone || user?.currentZone;
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
