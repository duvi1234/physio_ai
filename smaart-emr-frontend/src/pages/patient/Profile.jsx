import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService, { toAssetUrl } from "../../services/patient.dashboard.service";
import { cardTitleClass, first, glassCardClass, inputClass } from "./patient.ui";

const genderOptions = ["Male", "Female", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const countries = ["India", "United States", "United Kingdom", "UAE", "Singapore", "Australia", "Canada", "Other"];

const emptyProfile = {
  patientId: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  age: "",
  phone: "",
  email: "",
  bloodGroup: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  insuranceProvider: "",
  insuranceNumber: "",
  allergies: "",
  profilePhotoUrl: "",
  photoUrl: ""
};

export default function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const row = await patientDashboardService.getProfile();
      const merged = {
        ...emptyProfile,
        ...row,
        dateOfBirth: row?.dateOfBirth ? new Date(row.dateOfBirth).toISOString().slice(0, 10) : "",
        allergies: Array.isArray(row?.allergies) ? row.allergies.join(", ") : row?.allergies || ""
      };
      setProfile(merged);
      setForm(merged);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const avatar = useMemo(() => {
    const gender = String(form.gender || profile.gender || "").toLowerCase();
    if (gender === "female") return "👩";
    if (gender === "male") return "👨";
    return "🧑";
  }, [form.gender, profile.gender]);

  const profilePhoto = useMemo(
    () => profile.photoUrl || toAssetUrl(profile.profilePhotoUrl),
    [profile.photoUrl, profile.profilePhotoUrl]
  );

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone,
        email: form.email,
        bloodGroup: form.bloodGroup,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        emergencyContactName: form.emergencyContactName,
        emergencyContactRelationship: form.emergencyContactRelationship,
        emergencyContactPhone: form.emergencyContactPhone,
        insuranceProvider: form.insuranceProvider,
        insuranceNumber: form.insuranceNumber,
        allergies: String(form.allergies || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };
      await patientDashboardService.updateProfile(payload);
      setMessage("Profile updated successfully.");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      await patientDashboardService.uploadProfilePhoto(formData);
      setPhotoFile(null);
      setMessage("Profile photo updated successfully.");
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="My Profile">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-300 bg-white text-4xl">
              {profilePhoto ? <img src={profilePhoto} alt="Patient" className="h-full w-full object-cover" /> : avatar}
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {`${first(profile.firstName, "")} ${first(profile.lastName, "")}`.trim() || "Patient"}
            </p>
            <p className="text-sm text-slate-600">{first(profile.patientId)}</p>
          </div>

          <div className="mt-4 rounded-xl bg-white/35 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Upload Photo</p>
            <input
              type="file"
              className={inputClass}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={uploadPhoto}
              disabled={!photoFile || uploading}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cardTitleClass}>Patient Profile Details</h3>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {loading ? <p className="text-sm text-slate-600">Loading profile...</p> : null}

          {!loading ? (
            <form onSubmit={saveProfile} className="grid gap-3 text-sm md:grid-cols-2">
              <input className={inputClass} value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="First Name" disabled={!editing} />
              <input className={inputClass} value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Last Name" disabled={!editing} />
              <select className={inputClass} value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} disabled={!editing}>
                <option value="">Select Gender</option>
                {genderOptions.map((row) => (
                  <option key={row} value={row}>
                    {row}
                  </option>
                ))}
              </select>
              <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} disabled={!editing} />
              <input className={inputClass} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" disabled={!editing} />
              <input className={inputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" disabled={!editing} />
              <select className={inputClass} value={form.bloodGroup} onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))} disabled={!editing}>
                <option value="">Blood Group</option>
                {bloodGroups.map((row) => (
                  <option key={row} value={row}>
                    {row}
                  </option>
                ))}
              </select>
              <select className={inputClass} value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} disabled={!editing}>
                <option value="">Country</option>
                {countries.map((row) => (
                  <option key={row} value={row}>
                    {row}
                  </option>
                ))}
              </select>
              <input className={`${inputClass} md:col-span-2`} value={form.addressLine1} onChange={(e) => setForm((p) => ({ ...p, addressLine1: e.target.value }))} placeholder="Address Line 1" disabled={!editing} />
              <input className={`${inputClass} md:col-span-2`} value={form.addressLine2} onChange={(e) => setForm((p) => ({ ...p, addressLine2: e.target.value }))} placeholder="Address Line 2" disabled={!editing} />
              <input className={inputClass} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" disabled={!editing} />
              <input className={inputClass} value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} placeholder="State" disabled={!editing} />
              <input className={inputClass} value={form.postalCode} onChange={(e) => setForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder="Postal Code" disabled={!editing} />
              <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => setForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))} placeholder="Emergency Phone" disabled={!editing} />
              <input className={inputClass} value={form.emergencyContactName} onChange={(e) => setForm((p) => ({ ...p, emergencyContactName: e.target.value }))} placeholder="Emergency Contact Name" disabled={!editing} />
              <input className={inputClass} value={form.emergencyContactRelationship} onChange={(e) => setForm((p) => ({ ...p, emergencyContactRelationship: e.target.value }))} placeholder="Relationship" disabled={!editing} />
              <input className={inputClass} value={form.insuranceProvider} onChange={(e) => setForm((p) => ({ ...p, insuranceProvider: e.target.value }))} placeholder="Insurance Provider" disabled={!editing} />
              <input className={inputClass} value={form.insuranceNumber} onChange={(e) => setForm((p) => ({ ...p, insuranceNumber: e.target.value }))} placeholder="Insurance Number" disabled={!editing} />
              <input className={`${inputClass} md:col-span-2`} value={form.allergies} onChange={(e) => setForm((p) => ({ ...p, allergies: e.target.value }))} placeholder="Allergies (comma separated)" disabled={!editing} />

              {editing ? (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 disabled:opacity-60 md:col-span-2"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              ) : null}
            </form>
          ) : null}
        </motion.div>
      </section>
    </DashboardLayout>
  );
}
