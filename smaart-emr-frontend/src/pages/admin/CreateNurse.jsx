import { useState } from "react";
import { createNurse } from "../../services/user.service";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

export default function CreateNurse() {
  const [form, setForm] = useState({});
  const [modalData, setModalData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createNurse(form);
    setModalData(res.data.data);
  };

  return (
    <div className="flex justify-center">
      <GlassCard className="w-[500px]">
        <h2 className="text-2xl font-bold mb-6 text-center">
          👩‍⚕️ Create Nurse
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Full Name"
            required
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <Input
            placeholder="Phone"
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <Button>Create Nurse</Button>
        </form>
      </GlassCard>

      <Modal
        isOpen={modalData}
        onClose={() => setModalData(null)}
      >
        <h3 className="text-lg font-bold mb-4">
          ✅ Nurse Created Successfully
        </h3>

        <p><strong>User ID:</strong> {modalData?.userId}</p>
        <p><strong>Temp Password:</strong> {modalData?.tempPassword}</p>

        <p className="text-sm text-red-500 mt-3">
          Share credentials securely. User must change password on first login.
        </p>
      </Modal>
    </div>
  );
}
