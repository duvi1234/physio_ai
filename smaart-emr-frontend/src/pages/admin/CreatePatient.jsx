import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { createPatient } from "../../services/patient.service";

export default function CreatePatient() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    address: "",
    insuranceProvider: "",
    insuranceNumber: "",
    bloodGroup: "",
    allergies: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        allergies: form.allergies.split(",").map(a => a.trim())
      };

      await createPatient(payload);
      setMessage("✅ Patient Created Successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">
          🏥 Register New Patient
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
          <Input name="firstName" placeholder="First Name" onChange={handleChange} />
          <Input name="lastName" placeholder="Last Name" onChange={handleChange} />

          <Select name="gender" onChange={handleChange}>
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Select>

          <Input type="date" name="dateOfBirth" onChange={handleChange} />

          <Input name="phone" placeholder="Phone" onChange={handleChange} />
          <Input name="email" placeholder="Email" onChange={handleChange} />

          <Input name="address" placeholder="Address" onChange={handleChange} className="col-span-2" />

          <Input name="insuranceProvider" placeholder="Insurance Provider" onChange={handleChange} />
          <Input name="insuranceNumber" placeholder="Insurance Number" onChange={handleChange} />

          <Input name="bloodGroup" placeholder="Blood Group (O+, A-, etc)" onChange={handleChange} />
          <Input name="allergies" placeholder="Allergies (comma separated)" onChange={handleChange} />

          <div className="col-span-2">
            <Button type="submit">
              {loading ? "Creating..." : "Create Patient"}
            </Button>
          </div>

          {message && (
            <p className="col-span-2 text-center text-sm text-green-600">
              {message}
            </p>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
