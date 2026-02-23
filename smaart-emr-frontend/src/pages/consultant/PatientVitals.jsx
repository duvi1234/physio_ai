import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { getPatientVitals } from "../../services/consultant.service";

export default function PatientVitals() {
  const { patientId } = useParams();
  const [vitals, setVitals] = useState([]);
  const [toast, setToast] = useState({ type: "success", message: "" });

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const res = await getPatientVitals(patientId);
        setVitals(res.data.data || []);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Unable to fetch vitals." });
      }
    };
    fetchVitals();
  }, [patientId]);

  return (
    <div className="p-8 grid gap-4">
      <ToastAlert type={toast.type} message={toast.message} />
      {vitals.map((v) => (
        <GlassCard key={v._id}>
          <p><strong>BP:</strong> {v.bloodPressure || "-"}</p>
          <p><strong>Pulse:</strong> {v.pulse || "-"}</p>
          <p><strong>Temperature:</strong> {v.temperature || "-"}</p>
          <p><strong>SpO2:</strong> {v.oxygenSaturation || "-"}</p>
          <p className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
        </GlassCard>
      ))}
    </div>
  );
}
