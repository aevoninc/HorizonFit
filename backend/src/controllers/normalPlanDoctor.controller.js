// src/controllers/normalPlanPatient.controller.js
import DailyLog from "../model/normalPlanModels/dailyLog.model.js";
import PatientZoneProgress from "../model/normalPlanModels/patientZoneProgress.model.js";
import DIYTaskTemplate from "../model/normalPlanModels/diyTaskTemplate.model.js";
import HorizonGuideVideo from "../model/normalPlanModels/horizonfitGuide.model.js";
import RecommendationsCache from "../model/normalPlanModels/recommendationsCache.model.js";
import NormalPlanPatient from "../model/user.model.js";
import ZoneVideo from "../model/normalPlanModels/zoneVideo.model.js";
import BodyMetrics from "../model/patientTrackingData.model.js";
import WeeklyLog from "../model/normalPlanModels/weeklyLog.model.js";
// import Patient = require('../models/Patient');

import patientTaskLog from "../model/patientTaskLog.model.js";
import calculateRecommendations from "../utils/healthCalculations.js";

// ==================== PATIENT MANAGEMENT ====================

// Get all Normal Plan patients with full details
const getNormalPlanPatients = async (req, res) => {
  try {
    // 1. Find all users who are Patients and on the Normal tier
    const patients = await NormalPlanPatient.find({
      role: "Patient",
      planTier: "normal",
    }).sort({ createdAt: -1 });

    const patientsWithDetails = await Promise.all(
      patients.map(async (user) => {
        const userId = user._id;

        // 2. Find the specific progress/zone data for this patient
        // Assuming your progress model is named NormalPlanPatient
        const planProgress = await NormalPlanPatient.findOne({ _id: userId });

        // 3. Get latest metrics (Weight)
        const latestMetrics = await BodyMetrics.findOne({
          patientId: userId,
          type: "Weight",
        }).sort({ dateRecorded: -1 });

        // 4. Get latest weekly log
        const latestWeeklyLog = await WeeklyLog.findOne({
          patientId: userId,
        }).sort({ submittedAt: -1 });

        // 5. Get recent activity
        const dailyLogs = await DailyLog.find({
          patientId: userId,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });

        const weeklyLogs = await WeeklyLog.find({
          patientId: userId,
        }).sort({ submittedAt: -1 });

        // Calculate compliance rate
        const complianceRate =
          weeklyLogs.length > 0
            ? Math.round(
                weeklyLogs.reduce((acc, log) => {
                  const score =
                    { excellent: 95, good: 80, fair: 60, poor: 30 }[
                      log.compliance
                    ] || 0;
                  return acc + score;
                }, 0) / weeklyLogs.length,
              )
            : 0;

        const lastDailyLog = await DailyLog.findOne({ patientId: userId }).sort(
          { date: -1 },
        );
        const daysSinceLastLog = lastDailyLog
          ? Math.floor(
              (Date.now() - new Date(lastDailyLog.date).getTime()) /
                (24 * 60 * 60 * 1000),
            )
          : 999;

        return {
          id: userId,
          name: user.name,
          email: user.email,
          mobile: user.mobileNumber,
          currentZone: planProgress?.currentZone || 1,
          totalWeeksCompleted:
            planProgress?.totalWeeksCompleted || user.totalWeeksCompleted || 0,
          lastLogDate: latestWeeklyLog?.submittedAt || null,
          lastDailyLogDate: lastDailyLog?.date || null,
          daysSinceLastDailyLog: daysSinceLastLog,
          complianceRate,
          status: user.status || "active",
          programStartDate: user.programStartDate,
          latestMetrics: latestMetrics
            ? {
                weight: latestMetrics.value,
                loggedAt: latestMetrics.dateRecorded,
              }
            : null,
          activeDaysThisWeek: dailyLogs.length,
          weeklyLogs: weeklyLogs.slice(0, 5),
        };
      }),
    );

    res.json(patientsWithDetails);
  } catch (error) {
    console.error("Error fetching normal plan patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
};

// Get single patient full details
const getNormalPlanPatientDetail = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || patientId === "undefined") {
      return res.status(400).json({
        error:
          "Invalid Patient ID. Please go back and select the patient again.",
      });
    }
    const normalPlanPatient = await NormalPlanPatient.findOne({
      role: "Patient",
      planTier: "normal",
    }).populate("patientId", "name email phone");

    if (!normalPlanPatient) {
      return res
        .status(404)
        .json({ error: "Patient not found in Normal Plan" });
    }

    // Get all zone progress
    const zoneProgress = await PatientZoneProgress.find({ patientId }).populate(
      "watchedVideos",
    );
    // Get all metrics history
    const metricsHistory = await BodyMetrics.find({ patientId }).sort({
      loggedAt: -1,
    });

    // Get all weekly logs
    const weeklyLogs = await WeeklyLog.find({ patientId })
      .populate("metricsId")
      .sort({ submittedAt: -1 });

    // Get all daily logs (last 30 days)
    const dailyLogs = await patientTaskLog.find({
      patientId,
      completionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Get current recommendations
    const recommendations = await RecommendationsCache.findOne({
      patientId,
    }).sort({ calculatedAt: -1 });

    // Get custom tasks
    const customTasks = normalPlanPatient.customTasks || [];
    // Normalize latest metrics
    let normalizedMetrics = {
      weight: null,
      bodyFatPercentage: null,
      visceralFat: null,
    };

    metricsHistory.forEach((metric) => {
      if (metric.type === "Weight") {
        normalizedMetrics.weight = metric.value;
      }
      if (metric.type === "bodyFatPercentage") {
        normalizedMetrics.bodyFatPercentage = metric.value;
      }
      if (metric.type === "visceralFat") {
        normalizedMetrics.visceralFat = metric.value;
      }
    });

    res.json({
      patient: {
        id: normalPlanPatient.patientId?._id,
        name: normalPlanPatient.name || "Unknown Patient",
        email: normalPlanPatient.email || "N/A",
        currentZone: normalPlanPatient.currentZone,
        status: normalPlanPatient.status,
        programStartDate: normalPlanPatient.programStartDate,
        programCompleted: normalPlanPatient.programCompleted,
        totalWeeksCompleted: normalPlanPatient.totalWeeksCompleted,
        doctorNotes: normalPlanPatient.doctorNotes,
      },
      zoneProgress,
      metricsHistory,
      weeklyLogs,
      normalizedMetrics, 
      dailyLogs,
      recommendations,
      customTasks,
    });
  } catch (error) {
    console.error("Error fetching patient detail:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
};

// Update patient status
const updatePatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, note } = req.body;

    const normalPlanPatient = await NormalPlanPatient.findOneAndUpdate(
      { patientId },
      {
        status,
        $push: note ? { doctorNotes: { note, createdAt: new Date() } } : {},
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!normalPlanPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ success: true, patient: normalPlanPatient });
  } catch (error) {
    console.error("Error updating patient status:", error);
    res.status(500).json({ error: "Failed to update patient status" });
  }
};

// Add doctor note to patient
const addDoctorNote = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { note } = req.body;

    const normalPlanPatient = await NormalPlanPatient.findOneAndUpdate(
      { patientId },
      {
        $push: { doctorNotes: { note, createdAt: new Date() } },
        updatedAt: new Date(),
      },
      { new: true },
    );

    res.json({ success: true, doctorNotes: normalPlanPatient.doctorNotes });
  } catch (error) {
    console.error("Error adding doctor note:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
};

// Override patient zone
const overridePatientZone = async (req, res) => {
  try {
    const { patientId } = req.params; // this is actually user._id
    const { zoneNumber, reason } = req.body;

    if (zoneNumber < 1 || zoneNumber > 5) {
      return res.status(400).json({ error: "Invalid zone number" });
    }

    const user = await NormalPlanPatient.findByIdAndUpdate(
      patientId,
      {
        currentZone: zoneNumber,
        $push: {
          doctorNotes: {
            note: `Zone manually changed to ${zoneNumber}. Reason: ${reason}`,
            createdAt: new Date(),
          },
        },
        updatedAt: new Date(),
      },
      { new: true },
    );


    if (!user) {
      return res.status(404).json({ error: "Patient not found" });
    }

    await PatientZoneProgress.findOneAndUpdate(
      { patientId: user._id, zoneNumber },
      { isUnlocked: true, startedAt: new Date() },
      { upsert: true },
    );

    res.json({ success: true, message: `Patient moved to Zone ${zoneNumber}` });
  } catch (error) {
    console.error("Error overriding patient zone:", error);
    res.status(500).json({ error: "Failed to override zone" });
  }
};

// Override recommendations
const overrideRecommendations = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { overrides } = req.body;

    const recommendations = await RecommendationsCache.findOneAndUpdate(
      { patientId },
      {
        doctorOverride: overrides,
        $push: {
          "doctorOverride.customNotes": `Updated by doctor on ${new Date().toISOString()}`,
        },
      },
      { new: true },
    );

    res.json({ success: true, recommendations });
  } catch (error) {
    console.error("Error overriding recommendations:", error);
    res.status(500).json({ error: "Failed to override recommendations" });
  }
};

// ==================== DIY TASK MANAGEMENT ====================

// Get all DIY task templates
const getDIYTaskTemplates = async (req, res) => {
  try {
    const { zoneNumber } = req.query;

    const query = zoneNumber ? { zoneNumber: parseInt(zoneNumber) } : {};
    const tasks = await DIYTaskTemplate.find(query).sort({
      zoneNumber: 1,
      order: 1,
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching DIY tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// Create DIY task template
const createDIYTaskTemplate = async (req, res) => {
  try {
    const { zoneNumber, category, title, description, icon, order } = req.body;

    const task = new DIYTaskTemplate({
      zoneNumber,
      category,
      title,
      description,
      icon,
      order: order || 0,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating DIY task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

// Update DIY task template
const updateDIYTaskTemplate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await DIYTaskTemplate.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error updating DIY task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

// Delete DIY task template
const deleteDIYTaskTemplate = async (req, res) => {
  try {
    const { taskId } = req.params;

    await DIYTaskTemplate.findByIdAndDelete(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting DIY task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// Add custom task for specific patient
const addPatientCustomTask = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { taskTemplateId, customDescription } = req.body;

    await NormalPlanPatient.findOneAndUpdate(
      { patientId },
      {
        $push: {
          customTasks: {
            taskTemplateId,
            customDescription,
            isActive: true,
          },
        },
        updatedAt: new Date(),
      },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding custom task:", error);
    res.status(500).json({ error: "Failed to add custom task" });
  }
};

// ==================== VIDEO MANAGEMENT ====================

// Get all zone videos
const getZoneVideos = async (req, res) => {
  try {
    const { zoneNumber } = req.query;
    const query = zoneNumber
      ? { zoneNumber: parseInt(zoneNumber), isActive: true }
      : { isActive: true };
    const videos = await ZoneVideo.find(query).sort({
      zoneNumber: 1,
      order: 1,
    });

    res.json(videos);
  } catch (error) {
    console.error("Error fetching zone videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

// Create zone video
const createZoneVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      zoneNumber,
      order,
      isRequired,
      pdfUrl,
    } = req.body;

    // CORRECTED LOGIC:
    // 1. Title and Zone Number are always required.
    // 2. Either videoUrl OR pdfUrl must be present.
    if (!title || !zoneNumber || (!videoUrl && !pdfUrl)) {
      return res.status(400).json({
        // Use 400 (Bad Request), not 401 (Unauthorized)
        message:
          "Please provide a Title, Zone Number, and either a Video URL or PDF URL.",
      });
    }

    const video = new ZoneVideo({
      title,
      description,
      videoUrl: videoUrl || undefined,
      pdfUrl: pdfUrl || undefined,
      thumbnailUrl,
      duration: duration || (pdfUrl ? "N/A" : ""), // Default for PDF
      zoneNumber,
      order: order || 0,
      isRequired: isRequired !== false,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error("Error creating zone video:", error);
    res.status(500).json({ error: "Internal server error while saving." });
  }
};

// Update zone video
const updateZoneVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const updates = req.body;

    const video = await ZoneVideo.findByIdAndUpdate(
      videoId,
      { ...updates, updatedAt: new Date() },
      { new: true },
    );

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(video);
  } catch (error) {
    console.error("Error updating zone video:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
};

// Delete zone video
const deleteZoneVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    await ZoneVideo.findByIdAndUpdate(videoId, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting zone video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

// Get all horizon guide videos
const getHorizonGuideVideos = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
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

// Create horizon guide video
const createHorizonGuideVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      order,
    } = req.body;

    const video = new HorizonGuideVideo({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      order: order || 0,
    });

    await video.save();
    res.status(201).json(video);
  } catch (error) {
    console.error("Error creating horizon guide video:", error);
    res.status(500).json({ error: "Failed to create video" });
  }
};

// Update horizon guide video
const updateHorizonGuideVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const updates = req.body;

    const video = await HorizonGuideVideo.findByIdAndUpdate(
      videoId,
      { ...updates, updatedAt: new Date() },
      { new: true },
    );

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(video);
  } catch (error) {
    console.error("Error updating horizon guide video:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
};

// Delete horizon guide video
const deleteHorizonGuideVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    await HorizonGuideVideo.findByIdAndUpdate(videoId, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting horizon guide video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

// ==================== ANALYTICS & MONITORING ====================

// Get daily activity report for all patients
const getDailyActivityReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPatients = await NormalPlanPatient.find({
      status: "active",
    }).populate("patientId", "name email");

    const reportResults = await Promise.all(
      allPatients.map(async (np) => {
        // FIX: Check if patientId exists before trying to access ._id
        if (!np.patientId) {
          return null; // This patient is broken/deleted, skip them
        }

        const todayLog = await DailyLog.findOne({
          patientId: np.patientId._id,
          date: { $gte: today },
        }).populate("completedTasks");

        const lastLog = await DailyLog.findOne({
          patientId: np.patientId._id,
        }).sort({ date: -1 });

        const daysSinceLastLog = lastLog
          ? Math.floor(
              (Date.now() - new Date(lastLog.date).getTime()) /
                (24 * 60 * 60 * 1000),
            )
          : null;

        return {
          patientId: np.patientId._id,
          name: np.patientId.name,
          email: np.patientId.email,
          currentZone: np.currentZone,
          hasLoggedToday: !!todayLog,
          todayCompletedTasks: todayLog?.completedTasks?.length || 0,
          daysSinceLastLog,
          isAtRisk: daysSinceLastLog !== null && daysSinceLastLog >= 3,
        };
      }),
    );

    // Filter out the null values (the broken records we skipped)
    const report = reportResults.filter((r) => r !== null);

    res.json({
      date: today,
      totalPatients: report.length,
      activeToday: report.filter((r) => r.hasLoggedToday).length,
      atRisk: report.filter((r) => r.isAtRisk).length,
      patients: report,
    });
  } catch (error) {
    console.error("Error generating daily report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

// Get patient progress trends
const getPatientTrends = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await BodyMetrics.find({
      patientId,
      loggedAt: { $gte: startDate },
    }).sort({ loggedAt: 1 });

    const dailyLogs = await DailyLog.aggregate([
      {
        $match: {
          patientId: new mongoose.Types.ObjectId(patientId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          tasksCompleted: { $sum: { $size: "$completedTasks" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      metricsHistory: metrics.map((m) => ({
        date: m.loggedAt,
        weight: m.weight,
        bodyFatPercentage: m.bodyFatPercentage,
        visceralFat: m.visceralFat,
      })),
      dailyActivity: dailyLogs,
    });
  } catch (error) {
    console.error("Error fetching patient trends:", error);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
};

export {
  getNormalPlanPatients,
  getNormalPlanPatientDetail,
  updatePatientStatus,
  addDoctorNote,
  overridePatientZone,
  overrideRecommendations,
  getDIYTaskTemplates,
  createDIYTaskTemplate,
  updateDIYTaskTemplate,
  deleteDIYTaskTemplate,
  addPatientCustomTask,
  getZoneVideos,
  createZoneVideo,
  updateZoneVideo,
  deleteZoneVideo,
  getHorizonGuideVideos,
  createHorizonGuideVideo,
  updateHorizonGuideVideo,
  deleteHorizonGuideVideo,
  getDailyActivityReport,
  getPatientTrends,
};
