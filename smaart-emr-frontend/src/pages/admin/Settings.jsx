import { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";
import PageWrapper from "../../components/admin/PageWrapper";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { Toast } from "../../components/admin/Toast";
import adminService from "../../services/admin.service";

const moduleOptions = [
  { key: "patients", label: "Patients" },
  { key: "appointments", label: "Appointments" },
  { key: "nurses", label: "Nurses" },
  { key: "physios", label: "Physiotherapists" },
  { key: "requests", label: "Requests" },
  { key: "reports", label: "Reports" }
];

const roleOptions = ["ADMIN", "NURSE", "CONSULTANT", "PATIENT"];

const unwrap = (payload) => payload?.data || payload || {};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    clinicName: "SMAART EMR",
    clinicLogo: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
    timezone: "UTC",
    passwordPolicy: {
      minLength: 8,
      requireSpecialChar: true,
      expiryDays: 90
    },
    forcePasswordReset: false,
    modules: {
      patients: true,
      appointments: true,
      nurses: true,
      physios: true,
      requests: true,
      reports: true
    },
    rolePermissions: {}
  });

  const [rolePermissions, setRolePermissions] = useState({});

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminService.settings.get();
      const data = unwrap(res);
      setSettings((prev) => ({
        ...prev,
        ...data,
        passwordPolicy: data.passwordPolicy || prev.passwordPolicy,
        modules: data.modules || prev.modules
      }));
      setRolePermissions(data.rolePermissions || {});
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to load settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleModule = (key) => {
    setSettings((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: !prev.modules?.[key] }
    }));
  };

  const handleRolePermission = (role, moduleKey) => {
    setRolePermissions((prev) => {
      const rolePerms = prev[role] || {};
      return {
        ...prev,
        [role]: { ...rolePerms, [moduleKey]: !rolePerms[moduleKey] }
      };
    });
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.settings.update({
        ...settings,
        rolePermissions
      });
      setToast({ type: "success", message: "Settings saved successfully." });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <PageWrapper>
        {loading ? <LoadingSpinner label="Loading settings..." /> : null}

        <form onSubmit={saveSettings} className="space-y-6">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <SettingsIcon size={18} /> Clinic Information
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Clinic Name"
                value={settings.clinicName}
                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Clinic Email"
                value={settings.clinicEmail}
                onChange={(e) => setSettings({ ...settings, clinicEmail: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Clinic Phone"
                value={settings.clinicPhone}
                onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
              />
              <input
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
              <input
                className="md:col-span-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Clinic Address"
                value={settings.clinicAddress}
                onChange={(e) => setSettings({ ...settings, clinicAddress: e.target.value })}
              />
              <input
                className="md:col-span-2 rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Clinic Logo URL"
                value={settings.clinicLogo}
                onChange={(e) => setSettings({ ...settings, clinicLogo: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ShieldCheck size={18} /> Password Policy
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <input
                type="number"
                min={6}
                max={32}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Minimum Length"
                value={settings.passwordPolicy.minLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, minLength: Number(e.target.value) }
                  })
                }
              />
              <input
                type="number"
                min={0}
                max={365}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                placeholder="Expiry Days"
                value={settings.passwordPolicy.expiryDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, expiryDays: Number(e.target.value) }
                  })
                }
              />
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireSpecialChar}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, requireSpecialChar: e.target.checked }
                    })
                  }
                />
                Require Special Characters
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm md:col-span-3">
                <input
                  type="checkbox"
                  checked={settings.forcePasswordReset}
                  onChange={(e) => setSettings({ ...settings, forcePasswordReset: e.target.checked })}
                />
                Force password reset on next login
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Enable Modules</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {moduleOptions.map((module) => (
                <label
                  key={module.key}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={settings.modules?.[module.key]}
                    onChange={() => handleToggleModule(module.key)}
                  />
                  {module.label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Role Permissions</h3>
            <div className="mt-4 space-y-4">
              {roleOptions.map((role) => (
                <div key={role} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-900">{role}</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {moduleOptions.map((module) => (
                      <label key={`${role}-${module.key}`} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={rolePermissions?.[role]?.[module.key] || false}
                          onChange={() => handleRolePermission(role, module.key)}
                        />
                        {module.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </PageWrapper>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </AdminLayout>
  );
}
