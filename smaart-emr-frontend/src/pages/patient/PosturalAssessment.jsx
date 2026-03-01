import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Eye } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import patientDashboardService, { toAssetUrl } from "../../services/patient.dashboard.service";
import { buildSummaryDocument, cardTitleClass, first, formatDateTime, glassCardClass, sectionMutedClass } from "./patient.ui";

const getImagePath = (row, view) => {
  const keyMap = {
    front: ["frontImage", "frontImageUrl", "images.front", "front"],
    side: ["sideImage", "sideImageUrl", "images.side", "side"],
    back: ["backImage", "backImageUrl", "images.back", "back"]
  };
  const keys = keyMap[view] || [];
  for (const key of keys) {
    if (key.includes(".")) {
      const [a, b] = key.split(".");
      if (row?.[a]?.[b]) return row[a][b];
      continue;
    }
    if (row?.[key]) return row[key];
  }
  return "";
};

export default function PosturalAssessment() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const identity = patientDashboardService.getPatientIdentity();
      const patientRef = identity.patientId || identity.mongoId;
      const data = await patientDashboardService.getPosturalAssessments(patientRef);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load postural assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const latest = rows[0] || {};
  const previous = rows[1] || null;

  const cards = useMemo(
    () => [
      { label: "Front View", path: getImagePath(comparisonMode && previous ? previous : latest, "front") },
      { label: "Side View", path: getImagePath(comparisonMode && previous ? previous : latest, "side") },
      { label: "Back View", path: getImagePath(comparisonMode && previous ? previous : latest, "back") }
    ],
    [latest, previous, comparisonMode]
  );

  const downloadReport = () => {
    const html = buildSummaryDocument({
      title: "Postural Assessment Report",
      sections: [
        {
          title: "Assessment Summary",
          content: `
            <p><b>Date:</b> ${formatDateTime(latest.createdAt || latest.date)}</p>
            <p><b>Alignment Score:</b> ${first(latest.alignmentScore || latest.score)}</p>
            <p><b>Improvement:</b> ${first(latest.improvementPercent || latest.improvement)}%</p>
            <p><b>PT Comments:</b> ${first(latest.comments || latest.remarks)}</p>
          `
        }
      ]
    });
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <DashboardLayout title="Postural Assessment">
      {error ? <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <section className={`${glassCardClass} mb-8`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={cardTitleClass}>Postural Analysis</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setComparisonMode((prev) => !prev)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              {comparisonMode ? "Latest View" : "Comparison View"}
            </button>
            <button
              type="button"
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <Download size={14} />
              Download Report
            </button>
          </div>
        </div>
        <p className={sectionMutedClass}>
          {comparisonMode ? "Comparing with previous assessment capture." : "Showing most recent postural capture."}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {cards.map((row) => (
          <motion.div key={row.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={glassCardClass}>
            <p className="mb-3 text-sm font-semibold text-slate-900">{row.label}</p>
            <div className="relative h-52 overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50/50">
              {row.path ? (
                <img src={toAssetUrl(row.path)} alt={row.label} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No image uploaded</div>
              )}
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-dashed border-cyan-400">
                <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-cyan-400/80" />
                <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-cyan-400/70" />
              </div>
            </div>
            <p className="mt-2 text-xs text-cyan-700">AI alignment overlay placeholder</p>
          </motion.div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Alignment Score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{first(latest.alignmentScore || latest.score, 0)}</p>
        </div>
        <div className={glassCardClass}>
          <p className="text-xs uppercase text-slate-500">Improvement</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{first(latest.improvementPercent || latest.improvement, 0)}%</p>
        </div>
        <div className={glassCardClass}>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-cyan-700" />
            <p className="text-xs uppercase text-slate-500">PT Comments</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">{first(latest.comments || latest.remarks)}</p>
        </div>
      </section>

      <section className={`${glassCardClass} mt-8`}>
        <h3 className={cardTitleClass}>Assessment Timeline</h3>
        <div className="mt-4 space-y-3">
          {loading ? <p className={sectionMutedClass}>Loading assessments...</p> : null}
          {!loading && !rows.length ? <p className={sectionMutedClass}>No postural assessments available.</p> : null}
          {rows.map((row) => (
            <div key={row._id || row.id} className="rounded-xl bg-white/35 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{formatDateTime(row.createdAt || row.date)}</p>
              <p>Alignment Score: {first(row.alignmentScore || row.score)}</p>
              <p>Improvement: {first(row.improvementPercent || row.improvement)}%</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
