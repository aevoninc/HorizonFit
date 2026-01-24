// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["Patient", "Doctor"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    deactivationDate: {
      type: Date,
      default: null, // Should be null while the user is active
    },
    assignedCategory: {
      type: String,
      enum: ["Weight Gain", "Weight Loss", null],
      default: null,
    }, // e.g., 'Weight Loss'
    planTier: {
      type: String,
      enum: ["normal", "premium"],
      required: true,
    },
    programStartDate: { type: Date, default: null },
    programBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramBooking",
      default: null,
    },
    currentZone : { type: Number, required: true, min: 1, max: 5, default: 1 },
    lastMetricsDate: { type: Date },
    lastWeeklyLogDate: { type: Date },
    totalWeeksCompleted: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "at-risk", "paused", "completed"],
      default: "active",
    },
    doctorNotes: [
      {
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    customTasks: [
      {
        taskTemplateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DIYTaskTemplate",
        },
        customDescription: String,
        isActive: { type: Boolean, default: true },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware to hash password before saving (pre-save hook)
// UserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next();
//     }
//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // IMPORTANT: return
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      fullname: this.fullname,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

UserSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export default mongoose.model("User", UserSchema);
