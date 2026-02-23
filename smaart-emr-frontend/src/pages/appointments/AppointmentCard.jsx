export default function AppointmentCard({ data }) {
  return (
    <div className="p-5 rounded-2xl bg-white/40 backdrop-blur-md border 
    hover:shadow-2xl transition-all duration-300">

      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg text-indigo-700">
          {data.appointmentId}
        </h3>

        <span className={`px-3 py-1 rounded-full text-xs font-medium
          ${data.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
            data.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"}`}>
          {data.status}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        📅 {new Date(data.appointmentDate).toLocaleDateString()}
      </p>

      <p className="text-sm text-gray-600">
        ⏰ {data.timeSlot}
      </p>

      <p className="text-sm text-gray-600">
        📍 {data.location}
      </p>

      <p className="text-sm text-gray-600">
        🏥 Type: {data.appointmentType}
      </p>
    </div>
  );
}
