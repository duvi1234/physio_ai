import { useNavigate } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import Button from "../../components/ui/Button";

export default function StaffManagement() {
  const navigate = useNavigate();

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <GlassCard>
        <h2 className="text-xl font-bold mb-4">👩‍⚕️ Create Nurse</h2>
        <p className="text-gray-600 mb-4">
          Add new nursing staff to the hospital system.
        </p>
        <Button onClick={() => navigate("/admin/create-nurse")}>
          Create Nurse
        </Button>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-bold mb-4">🧑‍⚕️ Create Physio</h2>
        <p className="text-gray-600 mb-4">
          Add new physiotherapist to the system.
        </p>
        <Button onClick={() => navigate("/admin/create-physio")}>
          Create Physio
        </Button>
      </GlassCard>
    </div>
  );
}
