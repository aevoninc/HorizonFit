// models/User.js
import mongoose from 'mongoose';
import bcrypt from "bcrypt" 

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Patient', 'Doctor'], 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    
    deactivationDate: { 
        type: Date, 
        default: null // Should be null while the user is active
    },
    assignedCategory: { type: String, default: null }, // e.g., 'Weight Loss'
    programStartDate: { type: Date, default: null },
    programBookingId:{
      type: String, default: null 
    }
}, { timestamps: true });

// Middleware to hash password before saving (pre-save hook)
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateAccessToken = async function (){
  return jwt.sign(
  {
    _id : this._id,
    fullname: this.fullname,
    username:this.username,
    email:this.email
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn : process.env.ACCESS_TOKEN_EXPIRY
  }
)}

UserSchema.methods.generateRefreshToken = async function (){
  return jwt.sign(
  {
    _id : this._id
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn : process.env.REFRESH_TOKEN_EXPIRY
  }
)
};

export default mongoose.model('User', UserSchema);