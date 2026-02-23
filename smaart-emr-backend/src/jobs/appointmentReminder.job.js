const cron = require("node-cron");
const Appointment = require("../modules/appointment/appointment.model");
const notificationService = require("../modules/notification/notification.service");

const appointmentReminderJob = {
  start() {
    cron.schedule("0 * * * *", async () => {
      try {
        const now = new Date();
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const upcomingAppointments = await Appointment.find({
          appointmentDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
          status: "CONFIRMED",
          reminderSent: false
        })
          .populate("patient")
          .populate("physiotherapist", "name");

        for (const appointment of upcomingAppointments) {
          await notificationService.sendCustomNotification({
            phone: appointment?.patient?.phone,
            email: appointment?.patient?.email,
            subject: "Appointment Reminder - SMAART EMR",
            message: `Reminder: Appointment on ${new Date(appointment.appointmentDate).toLocaleString()} with ${appointment?.physiotherapist?.name || "consultant"}.`
          });

          appointment.reminderSent = true;
          await appointment.save();
        }
      } catch (error) {
        console.error("[AppointmentReminderJob] Error:", error.message);
      }
    });

    console.log("[SMAART] Appointment reminder job started (hourly, 1-day reminder)");
  }
};

module.exports = appointmentReminderJob;
