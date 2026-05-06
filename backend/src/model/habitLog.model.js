import mongoose from "mongoose";

const HABIT_CODES = ["Hydration", "Nutrition", "Exercise", "Sleep", "Mindset"];

const habitLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    zone: {
      type: Number,
      required: true,
    },
    day: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completedHabits: {
      type: [String],
      enum: HABIT_CODES,
      default: [],
    },
    habitDetails: [
      {
        habitCode: {
          type: String,
          enum: HABIT_CODES,
          required: true,
        },
        completedTasks: {
          type: [String],
          default: [],
        },
        mainTicked: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

// One log per patient per day
habitLogSchema.index({ patientId: 1, date: 1 }, { unique: true });

export default mongoose.model("HabitLog", habitLogSchema);
