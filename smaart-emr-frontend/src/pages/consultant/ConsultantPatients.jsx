import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { getMyPatients } from "../../services/consultant.service";
import { useNavigate } from "react-router-dom";

export default function ConsultantPatients() {
  const [patients, setPatients] = useState([]);
  const [toast, setToast] = useState({ type: "success", message: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getMyPatients();
        setPatients(res.data.data || []);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Failed to load patients." });
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="p-8 grid gap-4">
      <ToastAlert type={toast.type} message={toast.message} />
      {patients.map((patient) => (
        <GlassCard key={patient._id} className="flex justify-between">
          <div>
            <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
            <p className="text-sm text-gray-600">Patient ID: {patient.patientId}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/consultant/vitals/${patient.patientId}`)}>View Vitals</Button>
            <Button onClick={() => navigate(`/consultant/consult/${patient.patientId}`)}>Add Consultation</Button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
