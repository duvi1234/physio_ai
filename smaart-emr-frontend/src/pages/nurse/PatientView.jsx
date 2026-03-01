import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Activity, ClipboardCheck, CalendarClock } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import nurseDashboardService from "../../services/nurse.dashboard.service";
import painService from "../../services/painService";
import PainTimelineChart from "../../components/Pain3D/PainTimelineChart";
import PainReportExport from "../../components/Pain3D/PainReportExport";
import { first, formatDate, formatDateTime } from "./nurse.ui";

export default function PatientView() {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [painRows, setPainRows] = useState([]);
  const [toast, setToast] = useState(null);
  const painPanelRef = useRef(null);
  const painChartRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [patientRes, timelineRes] = await Promise.all([
        nurseDashboardService.getPatient(patientId),
        nurseDashboardService.getPatientTimeline(patientId)
      ]);
      setPatient(patientRes || null);
      setTimeline(timelineRes || null);
      try {
        const rows = await painService.listByPatient(patientId);
        setPainRows(Array.isArray(rows) ? rows : []);
      } catch {
        setPainRows([]);
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load patient." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  return (
    <DashboardLayout title="Patient View">
      <PageWrapper>
        {loading ? <LoadingSpinner /> : null}

        {patient ? (
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-slate-900">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-slate-600">Patient ID: {patient.patientId}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase text-slate-500">Phone</p>
                <p className="font-semibold">{first(patient.phone)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Email</p>
                <p className="font-semibold">{first(patient.email)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Gender</p>
                <p className="font-semibold">{first(patient.gender)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Age</p>
                <p className="font-semibold">{first(patient.age)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Activity size={18} /> Vitals History
            </div>
            <DataTable
              rows={timeline?.vitals || []}
              columns={[
                { label: "Recorded", render: (row) => formatDateTime(row.recordedAt || row.createdAt) },
                { label: "BP", render: (row) => first(row.bloodPressure) },
                { label: "Pulse", render: (row) => first(row.pulse) },
                { label: "Temp", render: (row) => first(row.temperature) }
              ]}
              emptyMessage="No vitals recorded."
            />
          </div>

          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl" ref={painPanelRef}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ClipboardCheck size={18} /> Pain Assessments
              </div>
              <PainReportExport
                patient={{
                  fullName: `${first(patient?.firstName, "")} ${first(patient?.lastName, "")}`.trim(),
                  patientId: first(patient?.patientId, patientId)
                }}
                reportRows={painRows}
                timelineRows={painRows}
                containerRef={painPanelRef}
                chartRef={painChartRef}
                notesLabel="Nurse Notes"
              />
            </div>
            <DataTable
              rows={painRows.length ? painRows : timeline?.painHistory || []}
              columns={[
                { label: "Date", render: (row) => formatDate(row.recordedAt || row.createdAt) },
                { label: "Score", render: (row) => first(row.intensity || row.painScale) },
                { label: "Area", render: (row) => first(row.region || row.affectedArea) },
                { label: "Notes", render: (row) => first(row.notes) }
              ]}
              emptyMessage="No pain assessments."
            />
            <div className="mt-4" ref={painChartRef}>
              <PainTimelineChart
                rows={(painRows.length ? painRows : timeline?.painHistory || []).map((row) => ({
                  createdAt: row.createdAt || row.recordedAt,
                  region: row.region || row.affectedArea,
                  intensity: Number(row.intensity || row.painScale || 0)
                }))}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarClock size={18} /> Appointment History
          </div>
          <DataTable
            rows={timeline?.sessions || []}
            columns={[
              { label: "Appointment ID", render: (row) => first(row.appointmentId) },
              { label: "Date", render: (row) => formatDate(row.appointmentDate) },
              { label: "Time", render: (row) => first(row.timeSlot) },
              { label: "Status", render: (row) => first(row.status) }
            ]}
            emptyMessage="No appointment history."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">Posture Assessment</h3>
            <p className="mt-3 text-sm text-slate-500">Read-only. Managed by physiotherapist.</p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-slate-900">Treatment Plan</h3>
            <p className="mt-3 text-sm text-slate-500">Read-only. Managed by physiotherapist.</p>
          </div>
        </div>
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
