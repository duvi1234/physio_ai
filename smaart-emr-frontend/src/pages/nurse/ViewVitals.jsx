import { useState } from "react";
import { getPatientVitals } from "../../services/nurse.service";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ViewVitals() {
  const [patientId, setPatientId] = useState("");
  const [vitals, setVitals] = useState([]);

  const fetchVitals = async () => {
    const res = await getPatientVitals(patientId);
    setVitals(res.data.data);
  };

  return (
    <div className="p-8">
      <GlassCard className="mb-6">
        <div className="flex gap-4">
          <Input
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) =>
              setPatientId(e.target.value)
            }
          />
          <Button onClick={fetchVitals}>
            View Vitals
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {vitals.map((v) => (
          <GlassCard key={v._id}>
            <div className="grid grid-cols-2 gap-4 text-sm">

              <p><b>Date:</b> {new Date(v.createdAt).toLocaleString()}</p>
              <p><b>Recorded By:</b> {v.recordedBy?.uniqueId}</p>

              <p><b>Height:</b> {v.height} cm</p>
              <p><b>Weight:</b> {v.weight} kg</p>
              <p><b>BMI:</b> {v.bmi}</p>

              <p><b>BP:</b> {v.bloodPressure}</p>
              <p><b>Pulse:</b> {v.pulse}</p>
              <p><b>Temp:</b> {v.temperature}</p>
              <p><b>SpO₂:</b> {v.oxygenSaturation}</p>

              <p className="col-span-2">
                <b>Medical History:</b> {v.pastMedicalHistory}
              </p>

              <p className="col-span-2">
                <b>Medications:</b> {v.currentMedications}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
