import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import ToastAlert from "../../components/dashboard/ToastAlert";
import {
  getPendingAppointments,
  acceptAppointment,
  rejectAppointment
} from "../../services/consultant.service";

export default function PendingAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [toast, setToast] = useState({ type: "success", message: "" });

  const fetchAppointments = async () => {
    try {
      const res = await getPendingAppointments();
      setAppointments(res.data.data || []);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Unable to fetch appointments." });
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptAppointment(id);
      fetchAppointments();
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Failed to accept appointment." });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectAppointment(id);
      fetchAppointments();
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Failed to reject appointment." });
    }
  };

  return (
    <div className="p-8 grid gap-4">
      <ToastAlert type={toast.type} message={toast.message} />
      {appointments.map((a) => (
        <GlassCard key={a._id}>
          <p><strong>Patient:</strong> {a.patient?.firstName} {a.patient?.lastName}</p>
          <p><strong>Date:</strong> {new Date(a.appointmentDate).toLocaleDateString()}</p>

          <div className="flex gap-3 mt-3">
            <Button onClick={() => handleAccept(a.appointmentId || a._id)}>Accept</Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={() => handleReject(a.appointmentId || a._id)}>
              Reject
            </Button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
