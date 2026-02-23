import { useEffect, useState } from "react";
import { getMyAppointments } from "../../services/appointment.service";
import AppointmentCard from "./AppointmentCard";
import GlassCard from "../../components/ui/GlassCard";
import ToastAlert from "../../components/dashboard/ToastAlert";

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "success", message: "" });

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await getMyAppointments();
        setAppointments(res.data.data || []);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Unable to fetch appointments." });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="p-8">
      <GlassCard>
        <ToastAlert type={toast.type} message={toast.message} />
        <h2 className="text-xl font-bold text-indigo-700 mb-6">My Appointments</h2>
        {loading ? <p className="text-sm text-gray-600">Loading appointments...</p> : null}
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.appointmentId || appt._id} data={appt} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
