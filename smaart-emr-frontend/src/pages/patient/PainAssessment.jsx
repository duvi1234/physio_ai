import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService from "../../services/patient.dashboard.service";
import painService from "../../services/painService";
import PainModelViewer from "../../components/Pain3D/PainModelViewer";
import PainRegionModal from "../../components/Pain3D/PainRegionModal";
import PainHeatmapToggle from "../../components/Pain3D/PainHeatmapToggle";
import PainViewToggle from "../../components/Pain3D/PainViewToggle";
import PainTimelineChart from "../../components/Pain3D/PainTimelineChart";
import PainReportExport from "../../components/Pain3D/PainReportExport";
import {
  cardTitleClass,
  first,
  formatDateTime,
  glassCardClass
} from "./patient.ui";

const INITIAL_MAP = {
  Pain_Head: {},
  Pain_Chest: {},
  Pain_Abdomen: {},
  Pain_Left_Arm: {},
  Pain_Right_Arm: {},
  Pain_Left_Leg: {},
  Pain_Right_Leg: {},
  Pain_Pelvis: {}
};

const meshToRegionLabel = (meshName = "") => meshName.replace("Pain_", "").replaceAll("_", " ");

export default function PainAssessment() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState([]);
  const [regionMap, setRegionMap] = useState(INITIAL_MAP);
  const [heatmap, setHeatmap] = useState(false);
  const [view, setView] = useState("front");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draftEntries, setDraftEntries] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const modelCaptureRef = useRef(() => "");
  const chartRef = useRef(null);

  const identity = patientDashboardService.getPatientIdentity();
  const patientRef = identity.patientId || identity.mongoId;
  const patientName = identity?.user?.name || "Patient";

  const loadRows = async () => {
    if (!patientRef) return;
    setLoading(true);
    setError("");
    try {
      const data = await painService.listByPatient(patientRef);
      const normalizedRows = Array.isArray(data) ? data : [];
      setRows(normalizedRows);
      const next = { ...INITIAL_MAP };
      normalizedRows.forEach((row) => {
        if (!row.region) return;
        const current = next[row.region];
        if (!current || new Date(row.createdAt) > new Date(current.createdAt || 0)) {
          next[row.region] = row;
        }
      });
      setRegionMap(next);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load pain assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, [patientRef]);

  const saveSession = async () => {
    const entries = Object.entries(draftEntries || {})
      .filter(([_, row]) => row?.bodyPart)
      .map(([_, row]) => ({
        entryId: row.entryId,
        bodyPart: row.bodyPart,
        intensity: Number(row.intensity || 1),
        type: row.type || "Dull",
        duration: row.duration || "1-3 Days",
        notes: row.notes || "",
        createdAt: row.createdAt || new Date().toISOString()
      }));

    if (!patientRef || !entries.length || saving) return;

    const idempotencyKey = `pain-${patientRef}-${Date.now()}`;
    try {
      setSaving(true);
      await painService.create({
        patientId: patientRef,
        painEntries: entries,
        assessmentDate: new Date().toISOString(),
        idempotencyKey
      }, { idempotencyKey });
      setMessage("Pain session saved successfully.");
      setDraftEntries({});
      await loadRows();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save pain session.");
    } finally {
      setSaving(false);
    }
  };

  const mergedRegionMap = useMemo(() => {
    const merged = { ...regionMap };
    Object.values(draftEntries).forEach((entry) => {
      if (!entry?.region) return;
      merged[entry.region] = {
        ...merged[entry.region],
        ...entry,
        intensity: entry.intensity,
        painType: entry.type,
        region: entry.region
      };
    });
    return merged;
  }, [draftEntries, regionMap]);

  const handleRegionDraftSave = (region, payload) => {
    if (!region) return;
    setDraftEntries((prev) => ({
      ...prev,
      [region]: {
        entryId: prev?.[region]?.entryId || `PE-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
        region,
        bodyPart: meshToRegionLabel(region),
        intensity: Number(payload.intensity || 1),
        type: payload.painType || "Dull",
        duration: payload.duration || "1-3 Days",
        notes: payload.notes || "",
        createdAt: new Date().toISOString()
      }
    }));
    setModalOpen(false);
    setMessage(`${meshToRegionLabel(region)} added to current session.`);
  };

  const captureModelCallback = useCallback((captureFn) => {
    modelCaptureRef.current = captureFn;
  }, []);

  const trendRows = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((row) => ({
          createdAt: row.createdAt,
          intensity: Number(row.intensity || 0),
          region: row.region
        })),
    [rows]
  );

  const latestEntries = useMemo(() => rows.slice(0, 8), [rows]);
  const exportSelectedParts = useMemo(() => {
    if (selectedRegion) return [selectedRegion];
    const latest = rows[0];
    if (!latest) return [];
    return [latest.region || latest.bodyPart].filter(Boolean);
  }, [rows, selectedRegion]);

  return (
    <DashboardLayout title="Pain Assessment">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className={cardTitleClass}>3D Pain Assessment</h3>
            <div className="flex flex-wrap items-center gap-2">
              <PainHeatmapToggle enabled={heatmap} onToggle={() => setHeatmap((prev) => !prev)} />
              <PainViewToggle view={view} onChange={setView} />
              <PainReportExport
                patient={{ fullName: patientName, patientId: patientRef }}
                reportRows={rows}
                timelineRows={trendRows}
                chartRef={chartRef}
                getModelImage={(options) => modelCaptureRef.current?.(options) || ""}
                selectedParts={exportSelectedParts}
                notesLabel="Patient Notes"
              />
              <button
                type="button"
                disabled={saving || !Object.keys(draftEntries).length}
                onClick={saveSession}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F4E79] px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#163A5F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                {saving ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>

          <PainModelViewer
            regionData={mergedRegionMap}
            heatmap={heatmap}
            view={view}
            selectedRegion={selectedRegion}
            onCaptureReady={captureModelCallback}
            onRegionClick={(region) => {
              setSelectedRegion(region);
              setModalOpen(true);
            }}
          />

          <div className="mt-4" ref={chartRef}>
            <PainTimelineChart rows={trendRows} />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Click any highlighted body region to add intensity, pain type, duration, and notes.
          </p>
          {Object.keys(draftEntries).length ? (
            <p className="mt-2 text-xs font-medium text-[#1F4E79]">
              Pending session entries: {Object.keys(draftEntries).length}
            </p>
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
          <h3 className={`${cardTitleClass} mb-3`}>Recent Entries</h3>
          {loading ? <p className="text-sm text-slate-600">Loading records...</p> : null}
          {!loading && !latestEntries.length ? <p className="text-sm text-slate-600">No pain entries found.</p> : null}
          <div className="space-y-3">
            {latestEntries.map((row) => (
              <div key={row._id || `${row.region}-${row.createdAt}`} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{meshToRegionLabel(first(row.region, "Region"))}</p>
                <p>Intensity: {first(row.intensity, 0)}/10</p>
                <p>Type: {first(row.painType, "-")}</p>
                <p>Duration: {first(row.duration, "-")}</p>
                <p>
                  Notes:{" "}
                  {row.notes && String(row.notes).length > 60 && !expandedNotes[row._id]
                    ? `${String(row.notes).slice(0, 60)}...`
                    : first(row.notes, "-")}
                </p>
                {row.notes && String(row.notes).length > 60 ? (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-cyan-700"
                    onClick={() =>
                      setExpandedNotes((prev) => ({ ...prev, [row._id]: !prev[row._id] }))
                    }
                  >
                    {expandedNotes[row._id] ? "View Less" : "View More"}
                  </button>
                ) : null}
                <p className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</p>
              </div>
            ))}
          </div>
          {saving ? <p className="mt-3 text-xs font-medium text-cyan-700">Syncing pain data...</p> : null}
        </motion.div>
      </section>

      <PainRegionModal
        open={modalOpen}
        region={selectedRegion}
        initialValue={mergedRegionMap[selectedRegion] || {}}
        onClose={() => setModalOpen(false)}
        onSaveNow={handleRegionDraftSave}
        isSaving={saving}
      />
    </DashboardLayout>
  );
}
