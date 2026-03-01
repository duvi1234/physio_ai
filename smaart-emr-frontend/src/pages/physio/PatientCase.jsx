import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  FileText,
  HeartPulse,
  Image,
  ClipboardCheck,
  FilePlus
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import PageWrapper from "../../components/dashboard/PageWrapper";
import DataTable from "../../components/dashboard/DataTable";
import LoadingSpinner from "../../components/dashboard/LoadingSpinner";
import ToastAlert from "../../components/dashboard/ToastAlert";
import physioService from "../../services/physio.service";
import painService from "../../services/painService";
import PainModelViewer from "../../components/Pain3D/PainModelViewer";
import PainHeatmapToggle from "../../components/Pain3D/PainHeatmapToggle";
import PainViewToggle from "../../components/Pain3D/PainViewToggle";
import PainTimelineChart from "../../components/Pain3D/PainTimelineChart";
import PainReportExport from "../../components/Pain3D/PainReportExport";
import PainRegionModal from "../../components/Pain3D/PainRegionModal";
import { first, formatDate, formatDateTime, inputClass } from "../nurse/nurse.ui";

const tabs = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "vitals", label: "Vitals & History", icon: ClipboardCheck },
  { key: "records", label: "Medical Records", icon: FileText },
  { key: "pain", label: "Pain Assessment", icon: HeartPulse },
  { key: "posture", label: "Postural Analysis", icon: Image },
  { key: "plan", label: "Exercise Plan", icon: FilePlus },
  { key: "notes", label: "Session Notes", icon: CalendarClock }
];

export default function PatientCase() {
  const { patientId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [toast, setToast] = useState(null);
  const [painRows, setPainRows] = useState([]);
  const [painHeatmap, setPainHeatmap] = useState(true);
  const [painView, setPainView] = useState("front");
  const [selectedPainRegion, setSelectedPainRegion] = useState("");
  const [painModalOpen, setPainModalOpen] = useState(false);
  const [savingPain, setSavingPain] = useState(false);
  const [painReport, setPainReport] = useState(null);
  const modelCaptureRef = useRef(() => "");
  const painChartRef = useRef(null);
  const [postureForm, setPostureForm] = useState({ appointmentId: "", manualCorrections: "", comments: "" });
  const [planForm, setPlanForm] = useState({ appointmentId: "", summary: "", exercisesText: "" });
  const [noteForm, setNoteForm] = useState({
    appointmentId: "",
    diagnosis: "",
    observations: "",
    treatmentGiven: "",
    recommendations: "",
    followUpDate: "",
    markCompleted: false
  });

  const loadCase = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await physioService.getPatientCase(patientId);
      setCaseData(data || null);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load patient case." });
    } finally {
      setLoading(false);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await physioService.getAppointments({ tab: "UPCOMING" });
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to load patients." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadCase();
    } else {
      loadList();
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    painService
      .listByPatient(patientId)
      .then((data) => setPainRows(Array.isArray(data) ? data : []))
      .catch(() => setPainRows([]));
  }, [patientId, caseData?.painAssessments?.length]);

  useEffect(() => {
    if (!patientId) return;
    painService
      .getReport(patientId)
      .then((data) => setPainReport(data || null))
      .catch(() => setPainReport(null));
  }, [patientId, painRows.length]);

  useEffect(() => {
    const latestRegion = painRows?.[0]?.region || painRows?.[0]?.bodyArea || "";
    if (latestRegion) {
      setSelectedPainRegion(String(latestRegion).startsWith("Pain_") ? latestRegion : `Pain_${String(latestRegion).replaceAll(" ", "_")}`);
    }
  }, [painRows]);

  useEffect(() => {
    const latest = caseData?.appointments?.[0];
    if (latest) {
      setPostureForm((prev) => ({ ...prev, appointmentId: latest.appointmentId || latest._id }));
      setPlanForm((prev) => ({ ...prev, appointmentId: latest.appointmentId || latest._id }));
      setNoteForm((prev) => ({ ...prev, appointmentId: latest.appointmentId || latest._id }));
    }
  }, [caseData]);

  const handleCreatePosture = async () => {
    try {
      await physioService.createPostureAnalysis({
        patientId,
        appointmentId: postureForm.appointmentId,
        manualCorrections: postureForm.manualCorrections,
        comments: postureForm.comments
      });
      setToast({ type: "success", message: "Posture analysis saved." });
      loadCase();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to save posture analysis." });
    }
  };

  const handleCreatePlan = async () => {
    const exercises = planForm.exercisesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, category, sets, reps, frequency] = line.split("|").map((v) => (v ? v.trim() : ""));
        return {
          name: name || "Exercise",
          category: category || "General",
          sets: Number(sets || 0),
          reps: Number(reps || 0),
          frequency: frequency || ""
        };
      });
    try {
      await physioService.createTreatmentPlan({
        patientId,
        appointmentId: planForm.appointmentId,
        summary: planForm.summary,
        exercises
      });
      setToast({ type: "success", message: "Treatment plan saved." });
      loadCase();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to save plan." });
    }
  };

  const handleCreateNote = async () => {
    try {
      await physioService.createSessionNote({
        ...noteForm,
        patientId,
        appointmentId: noteForm.appointmentId
      });
      setToast({ type: "success", message: "Session note saved." });
      loadCase();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Failed to save note." });
    }
  };

  const patient = caseData?.patient;
  const overviewAppointments = caseData?.appointments || [];
  const toMeshRegion = (value = "") => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.startsWith("Pain_")) return raw;
    return `Pain_${raw.replaceAll(" ", "_")}`;
  };
  const fromMeshRegion = (value = "") => String(value || "").replace("Pain_", "").replaceAll("_", " ");

  const painRegionMap = useMemo(() => {
    const base = {
      Pain_Head: {},
      Pain_Chest: {},
      Pain_Abdomen: {},
      Pain_Left_Arm: {},
      Pain_Right_Arm: {},
      Pain_Left_Leg: {},
      Pain_Right_Leg: {},
      Pain_Pelvis: {}
    };
    painRows.forEach((row) => {
      const region = toMeshRegion(row?.region || row?.bodyArea);
      if (!region) return;
      const current = base[region];
      if (!current || new Date(row.createdAt) > new Date(current.createdAt || 0)) {
        base[region] = row;
      }
    });
    return base;
  }, [painRows]);

  const painExportSelectedParts = useMemo(() => {
    if (selectedPainRegion) return [selectedPainRegion];
    const fallback = toMeshRegion(painRows?.[0]?.region || painRows?.[0]?.bodyArea);
    return fallback ? [fallback] : [];
  }, [painRows, selectedPainRegion]);

  const handleSavePhysioPain = async (region, payload) => {
    if (!patientId || !region || savingPain) return;
    try {
      setSavingPain(true);
      await painService.create({
        patientId,
        painEntries: [
          {
            entryId: `PE-${Date.now()}`,
            bodyPart: region,
            intensity: Number(payload.intensity || 1),
            type: payload.painType || "Dull",
            duration: payload.duration || "1-3 Days",
            notes: payload.notes || "",
            createdAt: new Date().toISOString()
          }
        ],
        assessmentDate: new Date().toISOString()
      });
      setPainModalOpen(false);
      setToast({ type: "success", message: "Pain entry saved for patient." });
      const data = await painService.listByPatient(patientId);
      setPainRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message || "Failed to save pain entry." });
    } finally {
      setSavingPain(false);
    }
  };

  return (
    <DashboardLayout title="Patient Case">
      <PageWrapper>
        {loading ? <LoadingSpinner /> : null}

        {!patientId ? (
          <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">Assigned Patients</h2>
            <p className="text-sm text-slate-500">Open a case to view the full EMR.</p>
            <div className="mt-4">
              <DataTable
                rows={appointments}
                columns={[
                  { label: "Appointment", render: (row) => first(row.appointmentId) },
                  {
                    label: "Patient",
                    render: (row) =>
                      `${first(row?.patient?.firstName, "")} ${first(row?.patient?.lastName, "")}`.trim()
                  },
                  { label: "Date", render: (row) => formatDate(row.appointmentDate) },
                  {
                    label: "Action",
                    render: (row) => (
                      <a
                        href={`/dashboard/physio/patients/${row?.patient?.patientId || row?.patient?._id}`}
                        className="rounded-lg bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700"
                      >
                        Open Case
                      </a>
                    )
                  }
                ]}
                emptyMessage="No patients assigned."
              />
            </div>
          </div>
        ) : null}

        {patientId && patient ? (
          <>
            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-slate-900">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm text-slate-600">Patient ID: {patient.patientId}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-700">
                <div>
                  <p className="text-xs uppercase text-slate-500">Phone</p>
                  <p className="font-semibold">{first(patient.phone)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Email</p>
                  <p className="font-semibold">{first(patient.email)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Assigned Physio</p>
                  <p className="font-semibold">You</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? "bg-cyan-600 text-white shadow-md"
                        : "border border-slate-200 bg-white/70 text-slate-700"
                    }`}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                  <h3 className="text-lg font-semibold text-slate-900">Visits Timeline</h3>
                  <DataTable
                    rows={overviewAppointments}
                    columns={[
                      { label: "Date", render: (row) => formatDate(row.appointmentDate) },
                      { label: "Time", render: (row) => first(row.timeSlot) },
                      { label: "Status", render: (row) => first(row.status) }
                    ]}
                    emptyMessage="No visits."
                  />
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                  <h3 className="text-lg font-semibold text-slate-900">Quick Insights</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="rounded-xl bg-white/60 p-3">
                      Last pain score: {first(caseData?.painAssessments?.[0]?.painScore)}
                    </div>
                    <div className="rounded-xl bg-white/60 p-3">
                      Next follow-up: {first(caseData?.notes?.[0]?.followUpDate ? formatDate(caseData?.notes?.[0]?.followUpDate) : "-")}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "vitals" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <DataTable
                  rows={caseData?.vitals || []}
                  columns={[
                    { label: "Recorded", render: (row) => formatDateTime(row.recordedAt || row.createdAt) },
                    { label: "BP", render: (row) => first(row.bloodPressure) },
                    { label: "Pulse", render: (row) => first(row.pulse) },
                    { label: "Temp", render: (row) => first(row.temperature) },
                    { label: "SpO2", render: (row) => first(row.oxygenSaturation) },
                    { label: "Nurse", render: (row) => first(row?.recordedBy?.name) }
                  ]}
                  emptyMessage="No vitals recorded."
                />
              </div>
            ) : null}

            {activeTab === "records" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <DataTable
                  rows={caseData?.records || []}
                  columns={[
                    { label: "Title", render: (row) => first(row.title) },
                    { label: "Category", render: (row) => first(row.category) },
                    { label: "Uploaded", render: (row) => formatDate(row.createdAt) },
                    {
                      label: "File",
                      render: (row) => (
                        <a className="text-cyan-700 underline" href={row.fileUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      )
                    }
                  ]}
                  emptyMessage="No records uploaded."
                />
              </div>
            ) : null}

            {activeTab === "pain" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Pain Assessment</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <PainHeatmapToggle enabled={painHeatmap} onToggle={() => setPainHeatmap((prev) => !prev)} />
                    <PainViewToggle view={painView} onChange={setPainView} />
                    <PainReportExport
                      patient={{
                        fullName: `${first(patient?.firstName, "")} ${first(patient?.lastName, "")}`.trim(),
                        patientId: first(patient?.patientId, patientId)
                      }}
                      reportRows={painRows}
                      chartRef={painChartRef}
                      getModelImage={(options) => modelCaptureRef.current?.(options) || ""}
                      selectedParts={painExportSelectedParts}
                      notesLabel="Physio Notes"
                    />
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                  <div className="rounded-xl border border-cyan-100 bg-white/70 p-3">
                    <PainModelViewer
                      regionData={painRegionMap}
                      heatmap={painHeatmap}
                      view={painView}
                      selectedRegion={selectedPainRegion}
                      onCaptureReady={(captureFn) => {
                        modelCaptureRef.current = captureFn;
                      }}
                      onRegionClick={(region) => {
                        setSelectedPainRegion(region);
                        setPainModalOpen(true);
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Click any body region to add pain entry manually for this patient.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-cyan-100 bg-white/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient Pain Summary</p>
                      <p className="mt-1 text-sm text-slate-700">
                        Average Pain: <span className="font-semibold">{first(painReport?.metrics?.averagePain, 0)}/10</span>
                      </p>
                      <p className="text-sm text-slate-700">
                        Most Affected: <span className="font-semibold">{first(painReport?.metrics?.mostAffectedRegion, "-")}</span>
                      </p>
                      <p className="text-sm text-slate-700">
                        Trend: <span className="font-semibold">{first(painReport?.metrics?.trend, "-")}</span>
                      </p>
                    </div>
                    <DataTable
                      rows={(painRows?.length ? painRows : caseData?.painAssessments) || []}
                      columns={[
                        { label: "Date", render: (row) => formatDate(row.createdAt) },
                        { label: "Area", render: (row) => first(fromMeshRegion(row.region || row.bodyArea)) },
                        { label: "Score", render: (row) => first(row.intensity || row.painScore) },
                        { label: "Type", render: (row) => first(row.painType) },
                        { label: "Notes", render: (row) => first(row.notes || row.description) }
                      ]}
                      emptyMessage="No pain assessments."
                    />
                  </div>
                </div>
                <div className="mt-4" ref={painChartRef}>
                  <PainTimelineChart
                    rows={painRows.map((row) => ({
                      createdAt: row.createdAt,
                      region: fromMeshRegion(row.region || row.bodyArea),
                      intensity: Number(row.intensity || row.painScore || 0)
                    }))}
                    readOnly
                  />
                </div>
                <PainRegionModal
                  open={painModalOpen}
                  region={selectedPainRegion}
                  initialValue={painRegionMap[selectedPainRegion] || {}}
                  onClose={() => setPainModalOpen(false)}
                  onSaveNow={handleSavePhysioPain}
                  isSaving={savingPain}
                />
              </div>
            ) : null}

            {activeTab === "posture" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-slate-900">Postural Analysis</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    className={inputClass}
                    value={postureForm.appointmentId}
                    onChange={(e) => setPostureForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
                  >
                    {overviewAppointments.map((row) => (
                      <option key={row.appointmentId || row._id} value={row.appointmentId || row._id}>
                        {row.appointmentId} - {formatDate(row.appointmentDate)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Manual corrections"
                    value={postureForm.manualCorrections}
                    onChange={(e) => setPostureForm((prev) => ({ ...prev, manualCorrections: e.target.value }))}
                  />
                  <textarea
                    rows={3}
                    className={`${inputClass} md:col-span-2`}
                    placeholder="Comments"
                    value={postureForm.comments}
                    onChange={(e) => setPostureForm((prev) => ({ ...prev, comments: e.target.value }))}
                  />
                  <button
                    onClick={handleCreatePosture}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md md:col-span-2"
                  >
                    Save Posture Analysis
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {(caseData?.posture || []).map((row) => (
                    <div key={row._id} className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Recorded {formatDateTime(row.createdAt)}</p>
                      <p>Shoulder Tilt: {first(row.aiResult?.shoulderTilt)}</p>
                      <p>Spinal Curvature: {first(row.aiResult?.spinalCurvature)}</p>
                      <p>Pelvic Imbalance: {first(row.aiResult?.pelvicImbalance)}</p>
                    </div>
                  ))}
                  {!caseData?.posture?.length ? <p className="text-sm text-slate-500">No posture records.</p> : null}
                </div>
              </div>
            ) : null}

            {activeTab === "plan" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-slate-900">Exercise Plans</h3>
                <div className="mt-4 grid gap-3">
                  <select
                    className={inputClass}
                    value={planForm.appointmentId}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
                  >
                    {overviewAppointments.map((row) => (
                      <option key={row.appointmentId || row._id} value={row.appointmentId || row._id}>
                        {row.appointmentId} - {formatDate(row.appointmentDate)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Plan summary"
                    value={planForm.summary}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, summary: e.target.value }))}
                  />
                  <textarea
                    rows={4}
                    className={inputClass}
                    placeholder="Exercises: Name|Category|Sets|Reps|Frequency (one per line)"
                    value={planForm.exercisesText}
                    onChange={(e) => setPlanForm((prev) => ({ ...prev, exercisesText: e.target.value }))}
                  />
                  <button
                    onClick={handleCreatePlan}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
                  >
                    Save Treatment Plan
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {(caseData?.plans || []).map((plan) => (
                    <div key={plan._id} className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">{first(plan.summary, "Treatment Plan")}</p>
                      <p>Status: {first(plan.status)}</p>
                      <ul className="mt-2 list-disc pl-5">
                        {(plan.exercises || []).slice(0, 6).map((ex, idx) => (
                          <li key={`${plan._id}-ex-${idx}`}>
                            {ex.name} - {ex.sets}x{ex.reps}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {!caseData?.plans?.length ? <p className="text-sm text-slate-500">No plans yet.</p> : null}
                </div>
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-slate-900">Session Notes</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    className={inputClass}
                    value={noteForm.appointmentId}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, appointmentId: e.target.value }))}
                  >
                    {overviewAppointments.map((row) => (
                      <option key={row.appointmentId || row._id} value={row.appointmentId || row._id}>
                        {row.appointmentId} - {formatDate(row.appointmentDate)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Diagnosis"
                    value={noteForm.diagnosis}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  />
                  <textarea
                    rows={3}
                    className={`${inputClass} md:col-span-2`}
                    placeholder="Observations"
                    value={noteForm.observations}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, observations: e.target.value }))}
                  />
                  <textarea
                    rows={2}
                    className={`${inputClass} md:col-span-2`}
                    placeholder="Treatment Given"
                    value={noteForm.treatmentGiven}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, treatmentGiven: e.target.value }))}
                  />
                  <textarea
                    rows={2}
                    className={`${inputClass} md:col-span-2`}
                    placeholder="Recommendations"
                    value={noteForm.recommendations}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                  />
                  <input
                    type="date"
                    className={inputClass}
                    value={noteForm.followUpDate}
                    onChange={(e) => setNoteForm((prev) => ({ ...prev, followUpDate: e.target.value }))}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={noteForm.markCompleted}
                      onChange={(e) => setNoteForm((prev) => ({ ...prev, markCompleted: e.target.checked }))}
                    />
                    Mark session completed
                  </label>
                  <button
                    onClick={handleCreateNote}
                    className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md md:col-span-2"
                  >
                    Save Session Note
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {(caseData?.notes || []).map((note) => (
                    <div key={note._id} className="rounded-xl bg-white/60 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {formatDateTime(note.createdAt)} - {first(note.diagnosis, "Session")}
                      </p>
                      <p>Observations: {first(note.observations)}</p>
                      <p>Treatment: {first(note.treatmentGiven)}</p>
                      <p>Recommendations: {first(note.recommendations)}</p>
                    </div>
                  ))}
                  {!caseData?.notes?.length ? <p className="text-sm text-slate-500">No notes recorded.</p> : null}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </PageWrapper>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50">
          <ToastAlert type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
