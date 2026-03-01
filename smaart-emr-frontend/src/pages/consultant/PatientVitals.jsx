import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { getPatientVitals } from "../../services/consultant.service";
import painService from "../../services/painService";
import PainTimelineChart from "../../components/Pain3D/PainTimelineChart";
import PainReportExport from "../../components/Pain3D/PainReportExport";

export default function PatientVitals() {
  const { patientId } = useParams();
  const [vitals, setVitals] = useState([]);
  const [painRows, setPainRows] = useState([]);
  const [toast, setToast] = useState({ type: "success", message: "" });
  const panelRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vitalsRes, painRes] = await Promise.all([
          getPatientVitals(patientId),
          painService.listByPatient(patientId)
        ]);
        setVitals(vitalsRes.data.data || []);
        setPainRows(Array.isArray(painRes) ? painRes : []);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Unable to fetch patient vitals." });
      }
    };
    fetchData();
  }, [patientId]);

  return (
    <div className="grid gap-4 p-8">
      <ToastAlert type={toast.type} message={toast.message} />
      <div className="flex justify-end">
        <PainReportExport
          patient={{ fullName: "Patient", patientId }}
          reportRows={painRows}
          timelineRows={painRows}
          containerRef={panelRef}
          chartRef={chartRef}
          notesLabel="Doctor Notes"
        />
      </div>
      <div ref={panelRef} className="grid gap-4">
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
      <div ref={chartRef}>
        <PainTimelineChart
          rows={painRows.map((row) => ({
            createdAt: row.createdAt,
            region: row.region,
            intensity: Number(row.intensity || 0)
          }))}
          readOnly
        />
      </div>
    </div>
  );
}
