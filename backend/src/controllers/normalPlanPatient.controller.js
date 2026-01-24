// src/controllers/User.controller.js
import DailyLog from "../model/normalPlanModels/dailyLog.model.js";
import PatientZoneProgress from "../model/normalPlanModels/patientZoneProgress.model.js";
import User from "../model/user.model.js";
import DIYTaskTemplate from "../model/normalPlanModels/diyTaskTemplate.model.js";
import HorizonGuideVideo from "../model/normalPlanModels/horizonfitGuide.model.js";
import RecommendationsCache from "../model/normalPlanModels/recommendationsCache.model.js";
import ZoneVideo from "../model/normalPlanModels/zoneVideo.model.js";
import BodyMetrics from "../model/patientTrackingData.model.js";
import WeeklyLog from "../model/normalPlanModels/weeklyLog.model.js";
import calculateRecommendations from "../utils/healthCalculations.js";
import PatientProgramTask from "../model/patientProgramTask.model.js";
import patientTaskLog from "../model/patientTaskLog.model.js";
// ==================== ZONE & PROGRESS ====================

// Get patient's Normal Plan progress
const getNormalPlanProgress = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Find the patient in the User collection
    let normalPlanPatient = await User.findById(patientId);

    if (!normalPlanPatient) {
      return res.status(404).json({ error: "Patient account not found" });
    }

    // Check if progress exists, if not, initialize Zone 1
    let zone1Progress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber: 1,
    });
    if (!zone1Progress) {
      await PatientZoneProgress.create({
        patientId,
        zoneNumber: 1,
        isUnlocked: true,
        startedAt: new Date(),
      });
    }

    // Get all zone progress records
    const zoneProgressList = await PatientZoneProgress.find({ patientId });

    // Get all active zone videos
    const allZoneVideos = await ZoneVideo.find({ isActive: true });

    // Get DIY tasks for the patient's current zone
    // FIXED: Using instance normalPlanPatient instead of Model User
    const zoneTasks = await PatientProgramTask.find({
      patientId: req.user._id,
      zone: normalPlanPatient.currentZone || 1,
    });
    // Get latest metrics
    const latestMetrics = await BodyMetrics.findOne({ patientId }).sort({
      loggedAt: -1,
    });

    // Get latest recommendations
    const recommendations = await RecommendationsCache.findOne({
      patientId,
    }).sort({ calculatedAt: -1 });

    // Get weekly logs history
    const weeklyLogs = await WeeklyLog.find({ patientId }).sort({
      submittedAt: -1,
    });

    // Calculate if they can enter metrics (once every 7 days)
    const lastMetricsDate = latestMetrics?.loggedAt;
    const daysSinceLastMetrics = lastMetricsDate
      ? Math.floor(
          (Date.now() - new Date(lastMetricsDate).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      : 999;

    // They can enter if it's been 7 days AND they are not at the end of the program
    const canEnterMetrics = daysSinceLastMetrics >= 7;

    // Build the data for the 5 Zones
    const zones = [1, 2, 3, 4, 5].map((zoneNumber) => {
      const progress = zoneProgressList.find(
        (zp) => zp.zoneNumber === zoneNumber
      );
      const videos = allZoneVideos.filter((v) => v.zoneNumber === zoneNumber);
      const watchedVideoIds =
        progress?.watchedVideos?.map((v) => v.toString()) || [];

      return {
        zoneNumber,
        zoneName: getZoneName(zoneNumber),
        zoneDescription: getZoneDescription(zoneNumber),
        isUnlocked: progress?.isUnlocked || false,
        isCompleted: progress?.isCompleted || false,
        videosCompleted: progress?.videosCompleted || false,
        requiredVideos: videos.map((v) => ({
          ...v.toObject(),
          isWatched: watchedVideoIds.includes(v._id.toString()),
        })),
        // Only show tasks for the zone the user is currently in
        diyTasks:
          zoneNumber === (normalPlanPatient.currentZone || 1) ? zoneTasks : [],
        weeksInZone: progress?.weeksInZone || 0,
        minWeeksRequired: getMinWeeksRequired(zoneNumber),
      };
    });

    // Return clean data to the frontend
    res.json({
      patientId,
      currentZone: normalPlanPatient.currentZone || 1,
      zones,
      latestMetrics,
      recommendations: recommendations
        ? {
            ...recommendations.toObject(),
            dailyCalories:
              recommendations.doctorOverride?.dailyCalories ||
              recommendations.dailyCalories,
            waterIntake:
              recommendations.doctorOverride?.waterIntake ||
              recommendations.waterIntake,
            sleepDuration:
              recommendations.doctorOverride?.sleepDuration ||
              recommendations.sleepDuration,
            exerciseMinutes:
              recommendations.doctorOverride?.exerciseMinutes ||
              recommendations.exerciseMinutes,
            exerciseType:
              recommendations.doctorOverride?.exerciseType ||
              recommendations.exerciseType,
            meditationMinutes:
              recommendations.doctorOverride?.meditationMinutes ||
              recommendations.meditationMinutes,
          }
        : null,
      weeklyLogs,
      totalWeeksCompleted: normalPlanPatient.totalWeeksCompleted || 0,
      programCompleted: normalPlanPatient.programCompleted || false,
      canEnterMetrics,
      daysSinceLastMetrics,
      daysUntilNextMetrics: canEnterMetrics ? 0 : 7 - daysSinceLastMetrics,
    });
  } catch (error) {
    console.error("Error fetching Normal Plan progress:", error);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again later." });
  }
};

// Check if videos are completed before allowing metrics entry
const checkVideoCompletion = async (req, res) => {
  try {
    const patientId = req.user.id;

    const normalPlanPatient = await User.findOne({ patientId });
    if (!normalPlanPatient) {
      return res
        .status(404)
        .json({ error: "Patient not found in Normal Plan" });
    }

    const zoneProgress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber: User.currentZone,
    });

    const allVideosWatched = zoneProgress?.videosCompleted || false;

    res.json({
      currentZone: User.currentZone,
      videosCompleted: allVideosWatched,
      canEnterMetrics: allVideosWatched,
    });
  } catch (error) {
    console.error("Error checking video completion:", error);
    res.status(500).json({ error: "Failed to check video completion" });
  }
};

// ==================== METRICS ====================

// Check if patient can enter metrics this week
const canEnterMetrics = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Check video completion first
    const normalPlanPatient = await User.findOne({ patientId });
    const zoneProgress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber: normalPlanPatient?.currentZone || 1,
    });

    if (!zoneProgress?.videosCompleted) {
      return res.json({
        canEnter: false,
        reason: "videos_incomplete",
        message: "You must watch all zone videos before entering your metrics.",
      });
    }

    // Check weekly limit
    const lastMetrics = await BodyMetrics.findOne({ patientId }).sort({
      loggedAt: -1,
    });

    if (lastMetrics) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastMetrics.loggedAt).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      if (daysSince < 7) {
        return res.json({
          canEnter: false,
          reason: "weekly_limit",
          message: `You can enter new metrics in ${7 - daysSince} days.`,
          lastEntryDate: lastMetrics.loggedAt,
          daysRemaining: 7 - daysSince,
        });
      }
    }

    res.json({
      canEnter: true,
      reason: null,
      message: "You can enter your metrics now.",
    });
  } catch (error) {
    console.error("Error checking metrics eligibility:", error);
    res.status(500).json({ error: "Failed to check eligibility" });
  }
};

// Submit body metrics (once per week, after videos)
const submitBodyMetrics = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { weight, bodyFatPercentage, visceralFat } = req.body;

    // 1. Define missing dateRecorded
    const dateRecorded = new Date();

    // Validate
    if (!weight || !bodyFatPercentage || visceralFat === undefined) {
      return res.status(400).json({ error: "All metrics are required" });
    }

    // Check video completion
    const normalPlanPatient = await User.findOne({ patientId });
    const zoneProgress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber: normalPlanPatient?.currentZone || 1,
    });

    if (!zoneProgress?.videosCompleted) {
      return res.status(403).json({
        error: "Videos not completed",
        message: "You must watch all zone videos before entering metrics.",
      });
    }

    // Check weekly limit
    // IMPORTANT: Make sure the sort field matches your schema (dateRecorded or loggedAt)
    const lastMetrics = await BodyMetrics.findOne({ patientId }).sort({
      dateRecorded: -1,
    });

    if (lastMetrics) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastMetrics.dateRecorded).getTime()) /
          (24 * 60 * 60 * 1000)
      );

      if (daysSince < 7) {
        return res.status(403).json({
          error: "Weekly limit exceeded",
          message: `You can enter new metrics in ${7 - daysSince} days.`,
          daysRemaining: 7 - daysSince,
        });
      }
    }

    const weightEntry = new BodyMetrics({
      patientId,
      dateRecorded,
      weekNumber: 1,
      type: "Weight",
      value: weight,
      unit: "kg",
    });

    const bodyFatEntry = new BodyMetrics({
      patientId,
      dateRecorded,
      weekNumber: 1,
      type: "bodyFatPercentage",
      value: bodyFatPercentage,
      unit: "%",
    });

    const visceralFatEntry = new BodyMetrics({
      patientId,
      dateRecorded,
      weekNumber: 1,
      type: "visceralFat",
      value: visceralFat,
      unit: "level",
    });

    // Save all three
    await Promise.all([
      weightEntry.save(),
      bodyFatEntry.save(),
      visceralFatEntry.save(),
    ]);

    // Calculate recommendations
    const recs = calculateRecommendations({
      weight,
      bodyFatPercentage,
      visceralFat,
    });

    // Save recommendations
    // FIX: Use weightEntry._id (or any of the 3) as the reference
    const recommendationsCache = new RecommendationsCache({
      patientId,
      metricsId: weightEntry._id,
      ...recs,
      calculatedAt: new Date(),
    });

    await recommendationsCache.save();

    // Update last metrics date
    await User.findOneAndUpdate(
      { patientId },
      { lastMetricsDate: new Date(), updatedAt: new Date() }
    );

    res.json({
      success: true,
      // FIX: Send back the data the UI expects
      metrics: { weight, bodyFatPercentage, visceralFat, dateRecorded },
      recommendations: recs,
      nextEntryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error("Error submitting body metrics:", error);
    res.status(500).json({ error: "Failed to submit metrics" });
  }
};

// ==================== VIDEOS ====================

// Mark video as watched
const markVideoWatched = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { videoId } = req.params;

    const video = await ZoneVideo.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Update zone progress
    let zoneProgress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber: video.zoneNumber,
    });

    if (!zoneProgress) {
      zoneProgress = new PatientZoneProgress({
        patientId,
        zoneNumber: video.zoneNumber,
        isUnlocked: true,
        watchedVideos: [videoId],
      });
    } else if (!zoneProgress.watchedVideos.includes(videoId)) {
      zoneProgress.watchedVideos.push(videoId);
    }

    // Check if all required videos are watched
    const allZoneVideos = await ZoneVideo.find({
      zoneNumber: video.zoneNumber,
      isRequired: true,
      isActive: true,
    });

    const allWatched = allZoneVideos.every((v) =>
      zoneProgress.watchedVideos.some(
        (wv) => wv.toString() === v._id.toString()
      )
    );

    zoneProgress.videosCompleted = allWatched;
    await zoneProgress.save();

    res.json({
      success: true,
      videosCompleted: allWatched,
      watchedCount: zoneProgress.watchedVideos.length,
      totalRequired: allZoneVideos.length,
    });
  } catch (error) {
    console.error("Error marking video watched:", error);
    res.status(500).json({ error: "Failed to mark video watched" });
  }
};

// Get Horizon Guide videos
const getHorizonGuideVideos = async (req, res) => {
  try {
    const { category } = req.query;

    // Build query object
    const query = { isActive: true };

    // Only add category to query if it's not 'all' and is actually provided
    if (category && category !== "all" && category !== "undefined") {
      query.category = category;
    }


    const videos = await HorizonGuideVideo.find(query).sort({
      category: 1,
      order: 1,
    });

    res.json(videos);
  } catch (error) {
    console.error("Error fetching horizon guide videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// ==================== DAILY LOGS ====================

// Submit daily log
const submitDailyLog = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { completedTaskIds, notes, mood } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already logged today
    const existingLog = await DailyLog.findOne({
      patientId,
      date: { $gte: today },
    });

    if (existingLog) {
      // Update existing log
      existingLog.completedTasks = completedTaskIds;
      existingLog.notes = notes;
      existingLog.mood = mood;
      await existingLog.save();

      return res.json({ success: true, log: existingLog, updated: true });
    }

    // Get current zone
    const normalPlanPatient = await User.findOne({ patientId });

    // Create new log
    const dailyLog = new DailyLog({
      patientId,
      zoneNumber: normalPlanPatient?.currentZone || 1,
      date: today,
      completedTasks: completedTaskIds,
      notes,
      mood,
    });

    await dailyLog.save();

    res.json({ success: true, log: dailyLog, updated: false });
  } catch (error) {
    console.error("Error submitting daily log:", error);
    res.status(500).json({ error: "Failed to submit daily log" });
  }
};

// Get today's log
const getTodayLog = async (req, res) => {
  try {
    const patientId = req.user.id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const log = await dailyLog.findOne({
      patientId,
      date: { $gte: start, $lte: end },
    });
    res.json(log || null);
  } catch (error) {
    console.error("Error fetching today log:", error);
    res.status(500).json({ error: "Failed to fetch log" });
  }
};

// Get daily logs history
const getDailyLogsHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await DailyLog.find({
      patientId,
      date: { $gte: startDate },
    })
      .populate("completedTasks")
      .sort({ date: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Error fetching daily logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

// ==================== WEEKLY LOGS ====================

// Submit weekly log
const submitWeeklyLog = async (req, res) => {
  const { patientId, zoneNumber, logData } = req.body;
  try {
    // 1. Save the actual log entry
    const newLog = new WeeklyLog({
      patientId,
      zoneNumber,
      ...logData,
      submittedAt: new Date(),
    });
    await newLog.save();

    // 2. Find the progress tracking record for this specific zone
    let zoneProgress = await PatientZoneProgress.findOne({
      patientId,
      zoneNumber,
    });

    // Fallback if record doesn't exist yet
    if (!zoneProgress) {
      zoneProgress = new PatientZoneProgress({
        patientId,
        zoneNumber,
        weeksInZone: 0,
        isUnlocked: true,
      });
    }

    // 3. Increment the count of weeks completed in this zone
    zoneProgress.weeksInZone += 1;

    // Per your requirement: 3 weeks are needed to move to the next level
    const WEEKS_REQUIRED = 3;

    if (zoneProgress.weeksInZone >= WEEKS_REQUIRED) {
      // --- TRANSITION LOGIC ---

      // A. Close out the current zone record
      zoneProgress.isCompleted = true;
      zoneProgress.completedAt = new Date();
      await zoneProgress.save();

      // B. Determine the next zone
      const nextZoneNumber = zoneNumber + 1;

      // C. Update the "Master" User Profile (INCREMENTing the currentZone)
      // This is crucial for keeping the UI simple for the patient
      await User.findByIdAndUpdate(patientId, {
        currentZone: nextZoneNumber,
        updatedAt: new Date(),
      });

      // D. Initialize the record for the next zone so it's ready for next week
      // Max zone is assumed to be 5
      if (nextZoneNumber <= 5) {
        await PatientZoneProgress.findOneAndUpdate(
          { patientId, zoneNumber: nextZoneNumber },
          {
            isUnlocked: true,
            startedAt: new Date(),
            weeksInZone: 0,
            isCompleted: false,
          },
          { upsert: true }
        );
      }

      return res.status(200).json({
        success: true,
        message: `Congratulations! You have completed Zone ${zoneNumber}. You are now promoted to Zone ${nextZoneNumber}!`,
        action: "ZONE_UPGRADE",
        newZone: nextZoneNumber,
      });
    } else {
      // If they haven't reached 3 weeks yet, just save the incremented progress
      await zoneProgress.save();

      const weeksLeft = WEEKS_REQUIRED - zoneProgress.weeksInZone;
      return res.status(200).json({
        success: true,
        message: `Weekly log saved successfully! Only ${weeksLeft} more week(s) to go until you reach the next level.`,
        action: "CONTINUE_ZONE",
        currentWeeks: zoneProgress.weeksInZone,
      });
    }
  } catch (error) {
    console.error("Error in submitWeeklyLog:", error);
    return res.status(500).json({
      success: false,
      message: "There was a problem saving your progress. Please try again.",
    });
  }
};

// ==================== DIY TASKS ====================

// Get DIY tasks for current zone
const getDIYTasks = async (req, res) => {
  try {
    const patientId = req.user.id;

    const normalPlanPatient = await User.findOne({ patientId });
    const currentZone = normalPlanPatient?.currentZone || 1;
    const tasks = await PatientProgramTask.find({
      zone: currentZone,
      isActive: true,
    }).sort({ order: 1 });

    // Get today's completed tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLog = await DailyLog.findOne({
      patientId,
      date: { $gte: today },
    });

    const completedTaskIds =
      todayLog?.completedTasks?.map((t) => t.toString()) || [];

    const tasksWithStatus = tasks.map((task) => ({
      ...task.toObject(),
      isCompleted: completedTaskIds.includes(task._id.toString()),
    }));

    res.json({
      currentZone,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    console.error("Error fetching DIY tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// ==================== HELPER FUNCTIONS ====================

function getZoneName(zoneNumber) {
  const names = {
    1: "Foundation",
    2: "Adaptation",
    3: "Momentum",
    4: "Transformation",
    5: "Mastery",
  };
  return names[zoneNumber] || `Zone ${zoneNumber}`;
}

function getZoneDescription(zoneNumber) {
  const descriptions = {
    1: "Build healthy habits and establish your baseline metrics",
    2: "Adapt your lifestyle to new routines and patterns",
    3: "Build momentum with consistent progress",
    4: "Experience visible transformation in your health",
    5: "Master your health and sustain lasting results",
  };
  return descriptions[zoneNumber] || "";
}

function getMinWeeksRequired(zoneNumber) {
  const weeks = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3 };
  return weeks[zoneNumber] || 2;
}

export {
  getNormalPlanProgress,
  checkVideoCompletion,
  canEnterMetrics,
  submitBodyMetrics,
  markVideoWatched,
  getHorizonGuideVideos,
  submitDailyLog,
  getTodayLog,
  getDailyLogsHistory,
  submitWeeklyLog,
  getDIYTasks,
};
