import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { recordVitals } from "../../services/nurse.service";

export default function RecordVitals() {
  const [form, setForm] = useState({
    patientId: "",
    appointmentId: "",
    height: "",
    weight: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    oxygenSaturation: "",
    pastMedicalHistory: "",
    pastSurgicalHistory: "",
    allergies: "",
    currentMedications: "",
    lifestyleFactors: ""
  });

  const [bmi, setBmi] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    // 🔥 Auto BMI Calculation
    if (updated.height && updated.weight) {
      const heightM = updated.height / 100;
      const bmiCalc = (
        updated.weight / (heightM * heightM)
      ).toFixed(2);
      setBmi(bmiCalc);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await recordVitals({
        ...form,
        allergies: form.allergies
          ? form.allergies.split(",").map(a => a.trim())
          : []
      });

      setMessage("✅ Vitals Recorded Successfully");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Error recording vitals"
      );
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-5xl animate-fadeIn">

        <h2 className="text-2xl font-bold text-indigo-700 mb-6">
          🩺 Record Patient Vitals
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-6"
        >
          {/* Patient Info */}
          <Input
            name="patientId"
            placeholder="Patient ID"
            onChange={handleChange}
          />

          <Input
            name="appointmentId"
            placeholder="Appointment ID (Optional)"
            onChange={handleChange}
          />

          {/* Measurements */}
          <Input
            name="height"
            type="number"
            placeholder="Height (cm)"
            onChange={handleChange}
          />

          <Input
            name="weight"
            type="number"
            placeholder="Weight (kg)"
            onChange={handleChange}
          />

          <Input
            name="bloodPressure"
            placeholder="Blood Pressure (120/80)"
            onChange={handleChange}
          />

          <Input
            name="pulse"
            type="number"
            placeholder="Pulse (bpm)"
            onChange={handleChange}
          />

          <Input
            name="temperature"
            type="number"
            placeholder="Temperature (°C)"
            onChange={handleChange}
          />

          <Input
            name="oxygenSaturation"
            type="number"
            placeholder="Oxygen Saturation (%)"
            onChange={handleChange}
          />

          {/* Medical History */}
          <textarea
            name="pastMedicalHistory"
            placeholder="Past Medical History"
            onChange={handleChange}
            className="col-span-2 p-3 rounded-xl bg-white/60 backdrop-blur border"
          />

          <textarea
            name="pastSurgicalHistory"
            placeholder="Past Surgical History"
            onChange={handleChange}
            className="col-span-2 p-3 rounded-xl bg-white/60 backdrop-blur border"
          />

          <Input
            name="allergies"
            placeholder="Allergies (comma separated)"
            onChange={handleChange}
          />

          <Input
            name="currentMedications"
            placeholder="Current Medications"
            onChange={handleChange}
          />

          <textarea
            name="lifestyleFactors"
            placeholder="Lifestyle Factors"
            onChange={handleChange}
            className="col-span-2 p-3 rounded-xl bg-white/60 backdrop-blur border"
          />

          {/* BMI Display */}
          {bmi && (
            <div className="col-span-2 text-indigo-700 font-semibold">
              Calculated BMI: {bmi}
            </div>
          )}

          <div className="col-span-2">
            <Button type="submit">
              Save Vitals
            </Button>
          </div>

          {message && (
            <p className="col-span-2 text-center text-green-600">
              {message}
            </p>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
