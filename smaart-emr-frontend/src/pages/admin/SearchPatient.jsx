import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { searchPatients } from "../../services/patient.service";

export default function SearchPatient() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);

  const handleSearch = async () => {
    const res = await searchPatients(query);
    setPatients(res.data.data);
  };

  return (
    <div className="p-8">
      <GlassCard>
        <h2 className="text-xl font-bold mb-4 text-blue-700">
          🔍 Search Patients
        </h2>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search by ID, phone, email, name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="space-y-3">
          {patients.map((p) => (
            <div
              key={p.patientId}
              className="p-4 rounded-xl bg-white/40 backdrop-blur-md border hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg">
                {p.firstName} {p.lastName}
              </h3>
              <p className="text-sm text-gray-600">
                ID: {p.patientId} | Phone: {p.phone}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
