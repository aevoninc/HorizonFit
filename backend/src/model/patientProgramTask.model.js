
import mongoose from "mongoose";

const PatientProgramTaskSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["nutrition", "exercise", "hydration", "sleep", "mindset"],
    },
    
    title: { type: String, required: true },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    description: { type: String, required: true },

    programWeek: { type: Number, required: true, min: 1, max: 15 },

    zone: { type: Number, required: true, min: 1, max: 5 },

    frequency: {
      type: String,
      enum: ["Daily", "SpecificDays", "Weekly", "OneTime"],
      required: true,
    },

    daysApplicable: [
      { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    ],

    timeOfDay: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Night"],
    },

    metricRequired: {
      type: String,
      enum: ["Weight Gain", "Weight Loss", null],
      default: null,
    },

    dateAssigned: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Missed"],
      default: "Pending",
    },

    completionDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("PatientProgramTask", PatientProgramTaskSchema);
