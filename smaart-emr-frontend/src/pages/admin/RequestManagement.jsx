import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import Select from "../../components/ui/Select";
import {
  getAllRequests,
  updateRequestStatus
} from "../../services/request.service";

export default function RequestManagement() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await getAllRequests();
    setRequests(res.data.data);
  };

  const handleStatusChange = async (id, status) => {
    await updateRequestStatus(id, status);
    fetchRequests();
  };

  return (
    <div className="p-8 grid gap-6">

      {requests.map((req) => (
        <GlassCard key={req._id}>

          <div className="flex justify-between">
            <div>
              <h3 className="font-bold text-indigo-700">
                {req.fullName}
              </h3>
              <p className="text-sm">{req.phone}</p>
              <p className="text-sm">{req.email}</p>
              <p className="text-sm">
                Dept: {req.department}
              </p>
              <p className="text-sm">
                Location: {req.location}
              </p>
              <p className="text-sm">
                Date: {req.preferredDate
                  ? new Date(req.preferredDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-sm">
                Slot: {req.preferredTimeSlot || "N/A"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Request ID: {req.requestId}
              </p>
            </div>

            <div className="text-right">
              <Select
                value={req.status}
                onChange={(e) =>
                  handleStatusChange(
                    req.requestId,
                    e.target.value
                  )
                }
              >
                <option value="PENDING">PENDING</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="REJECTED">REJECTED</option>
              </Select>

              {req.handledBy && (
                <p className="text-xs mt-2 text-gray-500">
                  Handled By: {req.handledBy.uniqueId}
                </p>
              )}
            </div>
          </div>

        </GlassCard>
      ))}

    </div>
  );
}