// =========================================================
// SEED DATA - Populates dummy data for development
// =========================================================
const mongoose = require("mongoose");
const User = require("../modules/user/user.model");
const Patient = require("../modules/patient/patient.model");
const Nurse = require("../modules/nurse/nurse.model");
const Consultant = require("../modules/consultant/consultant.model");
const Admin = require("../modules/admin/admin.model");
const Appointment = require("../modules/appointment/appointment.model");
const AppointmentRequest = require("../modules/appointmentRequest/request.model");
const MedicalRecord = require("../modules/medicalRecords/medicalRecord.model");
const Alert = require("../modules/alerts/alert.model");
const Notification = require("../modules/notification/notification.model");
const bcrypt = require("bcryptjs");

// Function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Check if data already exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log("✅ Database already seeded. Skipping...");
      return;
    }

    // ===== CREATE ADMIN =====
    const adminPassword = await hashPassword("Admin@123456");
    const admin = await Admin.create({
      firstName: "System",
      lastName: "Administrator",
      email: "admin@smaart-healthcare.com",
      name: "System Administrator", // Added name field
      password: adminPassword,
      role: "ADMIN",
      userType: "Admin",
      adminType: "SUPER_ADMIN",
      canManageUsers: true,
      canManageAppointments: true,
      canGenerateReports: true,
      canManageSettings: true,
      canApprovePatients: true
    });
    console.log("✅ Admin created:", admin.email);

    // ===== CREATE NURSES =====
    const nursePassword = await hashPassword("Nurse@123456");
    const nurses = [];
    const nurseData = [
      {
        name: "Nurse John Doe", // Added name field
        phone: "+1234567891",
        licenseNumber: "RN-2024-001",
        licenseExpiry: new Date("2026-12-31"),
        shift: "MORNING"
      },
      {
        name: "Nurse Jane Doe", // Added name field
        phone: "+1234567892",
        licenseNumber: "RN-2024-002",
        licenseExpiry: new Date("2026-12-31"),
        shift: "AFTERNOON"
      },
      {
        name: "Nurse Sarah Doe", // Added name field
        phone: "+1234567893",
        licenseNumber: "RN-2024-003",
        licenseExpiry: new Date("2026-12-31"),
        shift: "NIGHT"
      }
    ];

    for (const data of nurseData) {
      const nurse = await Nurse.create({
        ...data,
        password: nursePassword,
        role: "NURSE",
        userType: "Nurse",
        yearsOfExperience: Math.floor(Math.random() * 15) + 1,
        performanceRating: (Math.random() * 2 + 3).toFixed(1)
      });
      nurses.push(nurse);
    }
    console.log(`✅ ${nurses.length} Nurses created`);

    // ===== CREATE CONSULTANTS (Physiotherapists) =====
    const consultantPassword = await hashPassword("Consultant@123456");
    const consultants = [];
    const consultantData = [
      {
        firstName: "Dr. James",
        lastName: "Anderson",
        email: "james.anderson@smaart-healthcare.com",
        phone: "+1234567894",
        licenseNumber: "PT-2024-001",
        licenseExpiry: new Date("2027-12-31"),
        department: "PHYSIOTHERAPY"
      },
      {
        firstName: "Dr. Lisa",
        lastName: "Martinez",
        email: "lisa.martinez@smaart-healthcare.com",
        phone: "+1234567895",
        licenseNumber: "PT-2024-002",
        licenseExpiry: new Date("2027-12-31"),
        department: "ORTHOPEDICS"
      },
      {
        firstName: "Dr. Robert",
        lastName: "Wilson",
        email: "robert.wilson@smaart-healthcare.com",
        phone: "+1234567896",
        licenseNumber: "PT-2024-003",
        licenseExpiry: new Date("2027-12-31"),
        department: "NEUROLOGY"
      }
    ];

    for (const data of consultantData) {
      const consultant = await Consultant.create({
        ...data,
        password: consultantPassword,
        role: "CONSULTANT",
        userType: "Consultant",
        yearsOfExperience: Math.floor(Math.random() * 20) + 5,
        performanceRating: (Math.random() * 2 + 3.5).toFixed(1),
        consultationFee: Math.floor(Math.random() * 5000) + 2000
      });
      consultants.push(consultant);
    }
    console.log(`✅ ${consultants.length} Consultants created`);

    // ===== CREATE PATIENTS =====
    const patientPassword = await hashPassword("Patient@123456");
    const patients = [];
    const firstNames = ["John", "Jane", "David", "Maria", "Robert", "Jennifer", "William", "Elizabeth"];
    const lastNames = ["Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thompson"];

    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const patient = await Patient.create({
        firstName,
        lastName: lastName + i,
        email: `patient${i + 1}@example.com`,
        phone: `+123456789${i}`,
        password: patientPassword,
        role: "PATIENT",
        userType: "Patient",
        gender: Math.random() > 0.5 ? "MALE" : "FEMALE",
        dateOfBirth: new Date(1990 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"][Math.floor(Math.random() * 8)],
        emergencyContact: {
          name: "Emergency Contact",
          relationship: "Family",
          phone: `+9876543210`
        },
        assignedNurse: nurses[Math.floor(Math.random() * nurses.length)]._id,
        assignedConsultant: consultants[Math.floor(Math.random() * consultants.length)]._id,
        patientStatus: "ACTIVE",
        paidStatus: Math.random() > 0.3 ? "PAID" : "PENDING",
        totalSessionsAllocated: Math.floor(Math.random() * 20) + 5,
        sessionsCompleted: Math.floor(Math.random() * 15),
        approvedAt: new Date(),
        approvedBy: admin._id
      });
      patients.push(patient);
    }
    console.log(`✅ ${patients.length} Patients created`);

    // ===== CREATE APPOINTMENTS =====
    const appointments = [];
    for (let i = 0; i < 15; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const consultant = consultants[Math.floor(Math.random() * consultants.length)];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30));

      const appointment = await Appointment.create({
        patient: patient._id,
        consultant: consultant._id,
        nurse: nurses[Math.floor(Math.random() * nurses.length)]._id,
        appointmentDate,
        startTime: `${9 + Math.floor(Math.random() * 8)}:00`,
        endTime: `${10 + Math.floor(Math.random() * 8)}:00`,
        status: ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"][Math.floor(Math.random() * 4)],
        appointmentType: ["CONSULTATION", "FOLLOW_UP", "THERAPY_SESSION"][Math.floor(Math.random() * 3)],
        reason: "Regular check-up and therapy session",
        location: "Clinic Room A"
      });
      appointments.push(appointment);
    }
    console.log(`✅ ${appointments.length} Appointments created`);

    // ===== CREATE APPOINTMENT REQUESTS =====
    for (let i = 0; i < 5; i++) {
      await AppointmentRequest.create({
        firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        email: `request${i + 1}@example.com`,
        phone: `+11111111${i}0`,
        preferredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        reason: "Physical therapy consultation needed",
        status: ["PENDING", "APPROVED", "REJECTED"][Math.floor(Math.random() * 3)],
        processedBy: Math.random() > 0.5 ? admin._id : null
      });
    }
    console.log("✅ Appointment requests created");

    // ===== CREATE MEDICAL RECORDS =====
    for (let i = 0; i < 10; i++) {
      await MedicalRecord.create({
        patient: patients[Math.floor(Math.random() * patients.length)]._id,
        recordType: ["VITAL_SIGNS", "CONSULTATION_NOTE", "TREATMENT_PLAN"][Math.floor(Math.random() * 3)],
        title: `Medical Record ${i + 1}`,
        description: "Sample medical record for testing",
        vitals: {
          bloodPressure: "120/80",
          heartRate: Math.floor(Math.random() * 30 + 60),
          temperature: (36.5 + Math.random()).toFixed(1),
          weightKg: Math.floor(Math.random() * 40 + 60),
          heightCm: Math.floor(Math.random() * 20 + 160)
        },
        createdBy: nurses[0]._id
      });
    }
    console.log("✅ Medical records created");

    // ===== CREATE ALERTS =====
    for (let i = 0; i < 8; i++) {
      await Alert.create({
        patient: patients[Math.floor(Math.random() * patients.length)]._id,
        nurse: nurses[Math.floor(Math.random() * nurses.length)]._id,
        type: ["VITAL_ABNORMAL", "MEDICATION_DUE", "APPOINTMENT_REMINDER", "URGENT"][Math.floor(Math.random() * 4)],
        severity: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)],
        title: `Alert ${i + 1}`,
        message: "This is a sample alert message",
        isRead: Math.random() > 0.5
      });
    }
    console.log("✅ Alerts created");

    // ===== CREATE NOTIFICATIONS =====
    const allUsers = [admin, ...nurses, ...consultants, ...patients];
    for (let i = 0; i < 12; i++) {
      await Notification.create({
        recipient: allUsers[Math.floor(Math.random() * allUsers.length)]._id,
        type: ["APPOINTMENT", "DOCUMENT", "MESSAGE", "SYSTEM"][Math.floor(Math.random() * 4)],
        title: `Notification ${i + 1}`,
        message: "This is a sample notification message",
        priority: ["LOW", "NORMAL", "HIGH"][Math.floor(Math.random() * 3)],
        isRead: Math.random() > 0.5
      });
    }
    console.log("✅ Notifications created");

    console.log("\n✅ ✅ ✅ Database seeding completed successfully! ✅ ✅ ✅\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    throw error;
  }
};

module.exports = seedDatabase;
