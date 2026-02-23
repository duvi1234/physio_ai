import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import ToastAlert from "../../components/dashboard/ToastAlert";
import { getMyProfile } from "../../services/consultant.service";

export default function ConsultantProfile() {
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState({ type: "success", message: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data.data);
      } catch (err) {
        setToast({ type: "error", message: err?.response?.data?.message || "Unable to fetch profile." });
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="p-8 flex justify-center">
      <GlassCard className="w-full max-w-3xl">
        <ToastAlert type={toast.type} message={toast.message} />
        {!profile ? (
          <p className="text-sm text-gray-600">Loading profile...</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">Consultant Profile</h2>
            <div className="grid gap-3 text-gray-700">
              <p><strong>Name:</strong> {profile.name || profile.user?.name}</p>
              <p><strong>Email:</strong> {profile.email || profile.user?.email}</p>
              <p><strong>Specialization:</strong> {profile.specialization}</p>
              <p><strong>Qualification:</strong> {profile.qualification || "-"}</p>
              <p><strong>Experience:</strong> {profile.experienceYears || 0} Years</p>
              <p><strong>Consultation Fee:</strong> {profile.consultationFee || 0}</p>
              <div>
                <strong>Availability:</strong>
                {(profile.availability || []).length ? (
                  profile.availability.map((slot, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      {slot.day} - {slot.startTime} to {slot.endTime}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Not configured</p>
                )}
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
