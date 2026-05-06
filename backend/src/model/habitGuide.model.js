import mongoose from "mongoose";

const HABIT_CODES = ["Hydration", "Nutrition", "Exercise", "Sleep", "Mindset"];

const habitGuideSchema = new mongoose.Schema(
  {
    habitCode: {
      type: String,
      enum: HABIT_CODES,
      required: true,
    },
    zone: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // null = zone-level default (applies to ALL patients in that zone)
    // set to a patientId = patient-specific override
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tasks: [
      {
        taskName: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// ensure uniqueness per habitCode+zone+patientId combination
habitGuideSchema.index({ patientId: 1, zone: 1, habitCode: 1 }, { unique: true });

export const HABIT_CODE_LIST = HABIT_CODES;
export default mongoose.model("HabitGuide", habitGuideSchema);
