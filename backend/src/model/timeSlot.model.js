import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true,
      // e.g. "9:30 AM", "6:00 PM"
    },
    period: {
      type: String,
      enum: ["morning", "evening"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TimeSlot", timeSlotSchema);
