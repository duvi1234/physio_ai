import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import {
  getMyAppointments,
  updateAppointmentStatus
} from "../../services/appointment.service";

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const res = await getMyAppointments();
    setAppointments(res.data.data);
    setFiltered(res.data.data);
  };

  // 🔎 Search + Filter Logic
  useEffect(() => {
    let data = [...appointments];

    if (search) {
      data = data.filter((a) =>
        a.patient?.firstName
          ?.toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      data = data.filter((a) => a.status === statusFilter);
    }

    setFiltered(data);
  }, [search, statusFilter, appointments]);

  const handleStatusChange = async (id, status) => {
    await updateAppointmentStatus(id, status);
    fetchAppointments();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "NO_SHOW":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 space-y-6">

      <h2 className="text-3xl font-bold text-indigo-700">
        📅 Appointment Management
      </h2>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by patient name"
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="NO_SHOW">NO_SHOW</option>
        </Select>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6">

        {filtered.map((a) => (
          <GlassCard key={a._id}>

            <div className="flex justify-between items-start">

              <div className="space-y-2">

                <h3 className="text-lg font-semibold text-indigo-600">
                  {a.patient?.firstName} {a.patient?.lastName}
                </h3>

                <p className="text-sm text-gray-600">
                  Patient ID: {a.patient?.patientId}
                </p>

                <p className="text-sm">
                  Physio: {a.physiotherapist?.firstName}{" "}
                  {a.physiotherapist?.lastName}
                </p>

                <p className="text-sm">
                  Date:{" "}
                  {new Date(a.appointmentDate).toLocaleDateString()}
                </p>

                <p className="text-sm">
                  Time: {a.timeSlot}
                </p>

                <p className="text-sm">
                  Location: {a.location}
                </p>

                <p className="text-sm">
                  Type: {a.appointmentType}
                </p>

                {a.notes && (
                  <p className="text-xs text-gray-500">
                    Notes: {a.notes}
                  </p>
                )}

              </div>

              <div className="flex flex-col items-end gap-3">

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    a.status
                  )}`}
                >
                  {a.status}
                </span>

                <Select
                  value={a.status}
                  onChange={(e) =>
                    handleStatusChange(
                      a.appointmentId,
                      e.target.value
                    )
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                </Select>

              </div>

            </div>

          </GlassCard>
        ))}

      </div>

    </div>
  );
}