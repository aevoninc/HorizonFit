// controllers/doctorController.js
import asyncHandler from "../utils/asyncHandler.js";
import User from "../model/user.model.js";
import PatientProgramTask from "../model/patientProgramTask.model.js";
import PatientTrackingData from "../model/patientTrackingData.model.js";
import PatientTaskLog from "../model/patientTaskLog.model.js";
import ConsultationBooking from "../model/consultationBooking.model.js";
import Weight_Loss from "../utils/weightLossProgram.js";
import RefreshTokenModel from '../model/RefreshToken.model.js';  
import {
    DOCTOR_EMAIL,
    DOCTOR_NAME,
    ADMIN_MAIL,
} from "../constants.js";
import {
    sendConsultationUpdateEmail,
    sendPatientWelcomeEmail,
    sendTaskAssignmentEmail
} from '../utils/mailer.js';


// @desc    Create a new Patient (Manual process done by Doctor/Admin)
// @route   POST /api/doctor/create-patient
// @access  Private (Requires Doctor role via middleware)
const createPatient = asyncHandler(async (req, res) => {

 const { name, email, mobileNumber, password, assignedCategory, programStartDate, assignFixedMatrix } = req.body;

 if (!name || !email || !mobileNumber || !password || !assignedCategory) {
  return res
   .status(400)
   .json({
    message: "Please provide name, email, mobile number, password, and assigned category.",
   });
 }
    try {
    
     const userExists = await User.findOne({ email });
     if (userExists) {
      return res
       .status(400)
       .json({ message: `User already exists with this email: ${email}` });
     }
    
     const patient = await User.create({
      name,
      email,
      password,
      mobileNumber,
      role: "Patient",
      assignedCategory,
      programStartDate: programStartDate || new Date(),
     });
    
     if(!patient || !patient.assignedCategory){
      return res.status(400).json({ message: "Invalid patient data received." });
    }
let taskCount = 0;

    if (patient.assignedCategory == "Weight Loss" && assignFixedMatrix) {
        const tasksToInsert = Weight_Loss.map((task) => ({
            ...task,
            patientId: patient._id,
            status: "Pending",
            dateAssigned: new Date(),
        }));

        const newTasks = await PatientProgramTask.insertMany(tasksToInsert);
        taskCount = newTasks.length;
    }

    // Move the email and response OUTSIDE the if block so it always runs
    await sendPatientWelcomeEmail(email, name, DOCTOR_NAME, password);

    // ALWAYS return the patient object at the same level
    return res.status(201).json({
        success: true,
        message: taskCount > 0 
            ? `Patient created and ${taskCount} tasks assigned.` 
            : "Patient created successfully.",
        patient: patient // Keep this consistent!
    });
    }
    catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Server error while creating patient." });
    }
});

// @desc    Get list of all Patients (for Doctor's dashboard view)
// @route   GET /api/doctor/patients
// @access  Private/Doctor
const getPatientList = asyncHandler(async (req, res) => {
  const patients = await User.find({ role: "Patient" }).select(
    "-deactivationDate -password -createdAt -updatedAt"
  );
  res.status(200).json({
  success: true,
  count: patients.length,
  patients,
});

});

// @desc    Doctor allocates tasks and program metrics to a specific patient
// @route   POST /api/doctor/allocate-tasks/:patientId
// @access  Private/Doctor
const allocateTasks = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { tasks } = req.body;

  // 1. Validation: Check if the patient exists
  const patient = await User.findById(patientId).select("-createdAt -updatedAt -password -programStartDate");
  if (!patient || patient.role !== "Patient") {
    return res
      .status(404)
      .json({ message: "Patient not found or is not a Patient account." });
  }

  // 2. Validation: Ensure tasks array is provided
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res
      .status(400)
      .json({ message: "No tasks provided for allocation." });
  }

  // 4. Prepare the tasks for bulk insertion (Splitting by Day)
  const tasksToInsert = [];

  tasks.forEach((task) => {
    // If daysApplicable is provided and has items, create a separate entry for each day
    if (task.daysApplicable && Array.isArray(task.daysApplicable) && task.daysApplicable.length > 0) {
      task.daysApplicable.forEach((day) => {
        tasksToInsert.push({
          patientId,
          description: task.description,
          zone: task.zone,
          programWeek: task.programWeek,
          frequency: task.frequency,
          daysApplicable: [day], // Now stores only one day per document
          timeOfDay: task.timeOfDay,
          metricRequired: task.metricRequired || null,
          status: "Pending",
        });
      });
    } else {
      // If no days are specified (e.g., 'OneTime' or 'Daily' without day array), 
      // just push the task as a single entry
      tasksToInsert.push({
        patientId,
        description: task.description,
        zone: task.zone,
        programWeek: task.programWeek,
        frequency: task.frequency,
        daysApplicable: task.daysApplicable || [],
        timeOfDay: task.timeOfDay,
        metricRequired: task.metricRequired || null,
        status: "Pending",
      });
    }
  });

  // 5. Insert all expanded tasks into the database
  const newTasks = await PatientProgramTask.insertMany(tasksToInsert);

  await sendTaskAssignmentEmail(
    patient.email,
    patient.name,
    DOCTOR_NAME,
    `New Program Tasks Assigned`,
    null,
    `You have been assigned ${newTasks.length} new individual task entries as part of your health program. Please log in to your dashboard to view and start completing them.`
  );
  
  res.status(201).json({
    message: `${newTasks.length} task entries allocated to patient ${patientId} successfully.`,
    allocatedTasks: newTasks.map((t) => ({
      _id: t._id,
      description: t.description,
      programWeek: t.programWeek, // Fixed name to match your schema (programWeek)
      day: t.daysApplicable[0] || "N/A"
    })),
  });
});

// @desc    View all tracking data and tasks for a single Patient
// @route   GET /api/doctor/progress/:patientId
// @access  Private/Doctor
const getPatientProgress = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const patient = await User.findById(patientId).select("-createdAt -updatedAt -password");
  if (!patient || patient.role !== "Patient") {
    return res.status(404).json({ message: "Patient not found." });
  }
    // 2. Fetch all tracking data submitted by the patient
    const progressData = await PatientTrackingData.find({ patientId }).sort({ dateRecorded: 1 });

    // 3. Fetch all program tasks (Master Tasks)
    const programTasks = await PatientProgramTask.find({ patientId }).sort({ programWeek: 1, createdAt: 1 });
    
    // 4. Fetch all patient compliance logs (NEW)
    const taskLogs = await PatientTaskLog.find({ patientId }).sort({ completionDate: 1 });
    

    const bookings = await ConsultationBooking.find({ patientId }).sort({
        appointmentDate: -1,
    });

  res.status(200).json({
    patient: patient,
    trackingData: progressData,
    programTasks: programTasks,
    bookings: bookings,
  });
});

// @desc    Doctor updates a Master Task assigned to a patient
// @route   PATCH /api/doctor/tasks/:taskId
// @access  Private/Doctor
const updateTask = asyncHandler(async (req, res) => {
    // taskId comes from the URL parameter
    const { taskId } = req.params;
    // updateFields comes from the Doctor's request body
    const updateFields = req.body; 

    // Find the task by ID and update the fields provided in the body.
    const task = await PatientProgramTask.findOneAndUpdate(
        { _id: taskId },
        { $set: updateFields },
        { 
            new: true,           // Return the document *after* the update
            runValidators: true, // Crucial: Re-run Mongoose schema validators (e.g., for 'frequency', 'daysApplicable')
        } 
    );

    if (!task) {
        return res.status(404).json({ message: 'Master Task not found.' });
    }

    res.status(200).json({ message: 'Task updated successfully.', task });
});

// @desc    Doctor deletes a Master Task assigned to a patient
// @route   DELETE /api/doctor/tasks/:taskId
// @access  Private/Doctor
const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    try {
        // 1. Delete the Master Task
        const deletedTask = await PatientProgramTask.findByIdAndDelete(taskId);
    
        if (!deletedTask) {
            return res.status(404).json({ message: 'Master Task not found.' });
        }
    
        // 2. Delete all associated Patient Task Logs (CRITICAL for data integrity)
        await PatientTaskLog.deleteMany({ taskId });
    
        res.status(200).json({ message: 'Task and all associated compliance logs deleted successfully.' });
    } catch (error) {
        console.error("Error deleting task and associated logs:", error);
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get all pending and confirmed consultation requests for the logged-in Doctor
// @route   GET /api/doctor/consultations
// @access  Private/Doctor
const getConsultationRequests = asyncHandler(async (req, res) => {
    const doctorId = req.user._id;

    // Fetch all bookings assigned to this doctor, populating the patient's email
    const bookings = await ConsultationBooking.find({ doctorId })
        .populate('patientId', 'email') // Fetch just the email of the patient
        .sort({ requestedDateTime: 1 }); // Sort by the earliest requested time

    if (bookings.length === 0) {
        return res.status(200).json({ message: 'No consultation requests found.', bookings: [] });
    }

    res.status(200).json(bookings);
});


// @desc    Doctor confirms, reschedules, or cancels a consultation request
// @route   PATCH /api/doctor/consultations/:bookingId
// @access  Private/Doctor
const updateConsultationStatus = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { 
        status, // Expected: 'Confirmed', 'Rescheduled', 'Cancelled'
        confirmedDateTime // Only required if status is 'Confirmed' or 'Rescheduled'
    } = req.body;

    if (!['Confirmed', 'Rescheduled', 'Cancelled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid booking status provided.' });
    }

    const updateData = { status };

    // Handle Time Update if confirming or rescheduling
    if (status === 'Confirmed' || status === 'Rescheduled') {
        if (!confirmedDateTime) {
            return res.status(400).json({ message: 'Confirmed date and time is required for confirmation/rescheduling.' });
        }
        updateData.confirmedDateTime = new Date(confirmedDateTime);
    }


    if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found or not assigned to you.' });
    }
    // 3. Update the booking in the database
    const updatedBooking = await ConsultationBooking.findOneAndUpdate(
        { _id: bookingId },
        { $set: updateData },
        { new: true }
    );
    // 2. Send Email Notification to the Patient  
    const user = User.findById(updatedBooking.patientId).select('email name');
    await sendConsultationUpdateEmail(
        user.email,
        user.name,
        DOCTOR_NAME,
        status,
        updatedBooking.confirmedDateTime || updatedBooking.requestedDateTime
    );


    res.status(200).json({ 
        message: `Booking status updated to ${status} and patient notified.`, 
        booking: updatedBooking 
    });
});

// @desc    Get list of Patients whose 15-week program is completed
// @route   GET /api/doctor/patients/completed
// @access  Private/Doctor
const getCompletedPatients = asyncHandler(async (req, res) => {
    // 1. Calculate the cutoff date (Program Start Date + 15 Weeks)
    const cutoffDate = new Date();
    // 15 weeks * 7 days/week = 105 days.
    cutoffDate.setDate(cutoffDate.getDate() - 105); 

    // 2. Find patients whose programStartDate is BEFORE the cutoff date
    // (i.e., their 15 weeks have already elapsed)
    const completedPatients = await User.find({ 
        role: 'Patient', 
        isActive: true, // Only fetch active patients
        programStartDate: { $lte: cutoffDate } // Start date is less than or equal to 105 days ago
    }).select('email programStartDate assignedCategory');

    if (completedPatients.length === 0) {
        return res.status(200).json({ message: 'No patients found with a completed 15-week program.', patients: [] });
    }

    res.status(200).json(completedPatients);
});

// @desc    Doctor deactivates a patient account (for audit/program end)
// @route   PATCH /api/doctor/patient/:patientId/deactivate
// @access  Private/Doctor
const deactivatePatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    const patient = await User.findOneAndUpdate(
        { _id: patientId, role: 'Patient' },
        { isActive: false },
        { new: true }
    );

    if (!patient) {
        return res.status(404).json({ message: 'Patient not found.' });
    }

    res.status(200).json({ 
        message: 'Patient account successfully deactivated.', 
        patient: { _id: patient._id, email: patient.email, isActive: patient.isActive }
    });
});

// @desc    Get list of Deactivated Patients
// @route   GET /api/doctor/patients/deactivated
// @access  Private/Doctor
const getDeactivatedPatients = asyncHandler(async (req, res) => {
    const deactivatedPatients = await User.find({ 
        role: 'Patient', 
        isActive: false 
    }).select('name email deactivationDate assignedCategory');
    if (deactivatedPatients.length === 0) {
        return res.status(200).json({ message: 'No deactivated patients found.', patients: [] });
    }
    res.status(200).json(deactivatedPatients);
});

// @desc    Get Bookings with null patientId
// @route   GET /api/doctor/get-new-consultancy-request
// @access  Private/Doctor
const getNewConsultancyRequest = asyncHandler(async (req, res) => {
    const bookings = await ConsultationBooking.find({ patientId: null });
    if (bookings.length === 0) {
        return res.status(200).json({ message: 'No bookings found with null patientId.', bookings: [] });
    }
    res.status(200).json(bookings);
});

// @desc    Doctor deletes a Patient account and all associated data
// @route   DELETE /api/doctor/patient/:patientId
// @access  Private/Doctor
const deletePatient = asyncHandler(async (req, res) => {
    const { patientId } = req.params; // This is the User._id

    // 1. CRITICAL FIX: Delete ALL associated records using deleteMany({ patientId: ... })
    //    We use deleteMany because multiple logs/tasks are linked to one patientId.
    const logResult = await PatientTaskLog.deleteMany({ patientId: patientId });
    const taskResult = await PatientProgramTask.deleteMany({ patientId: patientId });
    const trackingResult = await PatientTrackingData.deleteMany({ patientId: patientId });
    
    // Note on refreshToken: If this model links the token via 'userId' or similar, 
    // you must use deleteMany({ userId: patientId }). If it truly links by patientId as _id, 
    // then the original findByIdAndDelete might be okay, but deleteMany is safer.
    // Assuming it links by a patient/user ID field:
    const tokenResult = await RefreshTokenModel.deleteMany({ userId: patientId }); // Adjust 'userId' field name if necessary


    // 2. Delete the main User (Patient) account
    const patient = await User.findOneAndDelete(
        { _id: patientId, role: 'Patient' }
    );

    if (!patient) {
        // Check only the User model for existence
        return res.status(404).json({ message: 'Patient not found.' });
    }
    
    // 3. Provide comprehensive success response
    res.status(200).json({ 
        message: 'Patient account and all associated data successfully deleted (Hard Delete).',
        summary: {
            user: patient._id,
            logsDeleted: logResult.deletedCount,
            tasksDeleted: taskResult.deletedCount,
            trackingDeleted: trackingResult.deletedCount,
            tokensDeleted: tokenResult.deletedCount,
        }
    });
});


export { 
  createPatient, 
  getPatientList, 
  allocateTasks, 
  getPatientProgress,
  updateTask,
  deleteTask,
  getConsultationRequests,
  updateConsultationStatus,
  getCompletedPatients,
  deactivatePatient,
  getDeactivatedPatients,
  getNewConsultancyRequest,
  deletePatient
};
