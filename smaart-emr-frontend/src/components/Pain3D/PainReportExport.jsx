import { useState } from "react";

const PAGE = { left: 12, right: 198, top: 12, bottom: 285 };
const CONTENT_WIDTH = PAGE.right - PAGE.left;
const ROW_HEIGHT = 7;

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const split = (doc, text, max = 42) => doc.splitTextToSize(String(text || "-"), max);

const withCard = (doc, x, y, w, h, fill = [255, 255, 255]) => {
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  doc.setDrawColor(203, 220, 233);
  doc.roundedRect(x, y, w, h, 2, 2, "S");
};

const fitImageInside = (doc, imageData, box) => {
  const imgProps = doc.getImageProperties(imageData);
  const scale = Math.min(box.w / imgProps.width, box.h / imgProps.height);
  const drawW = imgProps.width * scale;
  const drawH = imgProps.height * scale;
  const drawX = box.x + (box.w - drawW) / 2;
  const drawY = box.y + (box.h - drawH) / 2;
  return { drawX, drawY, drawW, drawH };
};

const drawHeader = (doc) => {
  withCard(doc, PAGE.left, PAGE.top, CONTENT_WIDTH, 22, [233, 243, 250]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SMAART EMR Hospital", PAGE.left + 4, PAGE.top + 9);
  doc.setFontSize(11);
  doc.text("Pain Assessment Clinical Report", PAGE.left + 4, PAGE.top + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDate(new Date())}`, PAGE.right - 4, PAGE.top + 9, { align: "right" });
  return PAGE.top + 27;
};

const drawPatientInfo = (doc, patient, y) => {
  withCard(doc, PAGE.left, y, CONTENT_WIDTH, 26, [248, 252, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Patient Information", PAGE.left + 3, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Patient Name: ${patient?.fullName || "-"}`, PAGE.left + 3, y + 14);
  doc.text(`Patient ID: ${patient?.patientId || "-"}`, PAGE.left + 3, y + 20);
  doc.text(`Age: ${patient?.age || "-"}`, PAGE.left + 70, y + 14);
  doc.text(`Gender: ${patient?.gender || "-"}`, PAGE.left + 70, y + 20);
  doc.text(`Assessment Date: ${formatDate(new Date())}`, PAGE.left + 116, y + 14);
  return y + 31;
};

const drawVisualCards = (doc, modelImage, chartImage, y) => {
  const gap = 4;
  const cardW = (CONTENT_WIDTH - gap) / 2;
  const cardH = 72;
  const leftX = PAGE.left;
  const rightX = PAGE.left + cardW + gap;
  const mediaY = y + 9;
  const mediaH = cardH - 12;
  const mediaPad = 3;

  withCard(doc, leftX, y, cardW, cardH, [255, 255, 255]);
  withCard(doc, rightX, y, cardW, cardH, [255, 255, 255]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Anatomical Pain Mapping", leftX + 3, y + 6);
  doc.text("Pain Timeline", rightX + 3, y + 6);

  doc.setDrawColor(226, 236, 244);
  doc.rect(leftX + mediaPad, mediaY, cardW - mediaPad * 2, mediaH);
  doc.rect(rightX + mediaPad, mediaY, cardW - mediaPad * 2, mediaH);

  if (modelImage) {
    const box = { x: leftX + mediaPad + 1, y: mediaY + 1, w: cardW - mediaPad * 2 - 2, h: mediaH - 2 };
    const fit = fitImageInside(doc, modelImage, box);
    doc.addImage(modelImage, "PNG", fit.drawX, fit.drawY, fit.drawW, fit.drawH, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Model snapshot unavailable", leftX + 18, mediaY + mediaH / 2);
  }

  if (chartImage) {
    const box = { x: rightX + mediaPad + 1, y: mediaY + 1, w: cardW - mediaPad * 2 - 2, h: mediaH - 2 };
    const fit = fitImageInside(doc, chartImage, box);
    doc.addImage(chartImage, "PNG", fit.drawX, fit.drawY, fit.drawW, fit.drawH, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Timeline unavailable", rightX + 24, mediaY + mediaH / 2);
  }

  return y + cardH + 4;
};

const drawTableHeader = (doc, y) => {
  doc.setFillColor(233, 243, 250);
  doc.rect(PAGE.left, y, CONTENT_WIDTH, ROW_HEIGHT, "F");
  doc.setDrawColor(203, 220, 233);
  doc.rect(PAGE.left, y, CONTENT_WIDTH, ROW_HEIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Body Part", PAGE.left + 2, y + 5);
  doc.text("Intensity", PAGE.left + 35, y + 5);
  doc.text("Type", PAGE.left + 52, y + 5);
  doc.text("Duration", PAGE.left + 71, y + 5);
  doc.text("Notes", PAGE.left + 94, y + 5);
  doc.text("Timestamp", PAGE.right - 2, y + 5, { align: "right" });
  return y + ROW_HEIGHT;
};

const drawPainTable = (doc, rows, startY) => {
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Pain Entries", PAGE.left, y);
  y += 3;
  y = drawTableHeader(doc, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  rows.forEach((row, index) => {
    const notes = split(doc, row.notes || "-", 66).slice(0, 2).join(" ");
    if (y + ROW_HEIGHT > PAGE.bottom - 34) {
      doc.addPage();
      y = drawHeader(doc);
      y = drawTableHeader(doc, y + 2);
    }
    if (index % 2 === 1) {
      doc.setFillColor(248, 252, 255);
      doc.rect(PAGE.left, y, CONTENT_WIDTH, ROW_HEIGHT, "F");
    }
    doc.setDrawColor(226, 236, 244);
    doc.rect(PAGE.left, y, CONTENT_WIDTH, ROW_HEIGHT);
    doc.text(String(row.bodyPart || row.region || "-").slice(0, 20), PAGE.left + 2, y + 5);
    doc.text(`${Number(row.intensity || 0)}/10`, PAGE.left + 35, y + 5);
    doc.text(String(row.type || row.painType || "-").slice(0, 15), PAGE.left + 52, y + 5);
    doc.text(String(row.duration || "-").slice(0, 18), PAGE.left + 71, y + 5);
    doc.text(notes.slice(0, 44), PAGE.left + 94, y + 5);
    doc.text(formatDate(row.createdAt), PAGE.right - 2, y + 5, { align: "right" });
    y += ROW_HEIGHT;
  });

  return y + 4;
};

const drawSummary = (doc, rows, y) => {
  const highest = rows.reduce(
    (best, row) => (Number(row.intensity || 0) > Number(best.intensity || 0) ? row : best),
    rows[0] || {}
  );
  const avg = rows.length
    ? (rows.reduce((sum, row) => sum + Number(row.intensity || 0), 0) / rows.length).toFixed(1)
    : "0.0";
  const summary = rows.length
    ? `Average pain score is ${avg}/10. Most affected region is ${highest.bodyPart || highest.region || "-"} with intensity ${highest.intensity || 0}/10.`
    : "No pain entries available for this report period.";

  if (y + 18 > PAGE.bottom - 20) {
    doc.addPage();
    y = drawHeader(doc);
  }
  withCard(doc, PAGE.left, y, CONTENT_WIDTH, 16, [248, 252, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Clinical Summary", PAGE.left + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(split(doc, summary, 178), PAGE.left + 3, y + 12);
  return y + 20;
};

const drawFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(90, 110, 130);
    doc.text("Generated via SMAART EMR System | Confidential Medical Record", PAGE.left, 292);
    doc.text(`Page ${page}/${pageCount}`, PAGE.right, 292, { align: "right" });
  }
};

export default function PainReportExport({
  patient,
  reportRows = [],
  chartRef,
  getModelImage,
  selectedParts = [],
  notesLabel = "Clinical Notes"
}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    if (!reportRows.length) {
      window.alert("No pain entries available to export.");
      return;
    }

    setExporting(true);
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);

      let chartImage = "";
      if (chartRef?.current) {
        const chartCanvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: "#ffffff" });
        chartImage = chartCanvas.toDataURL("image/png");
      }
      if (typeof getModelImage !== "function") {
        throw new Error("3D canvas capture is unavailable.");
      }

      const modelImage = await getModelImage({ selectedParts });
      if (!modelImage || modelImage.length < 5000) {
        throw new Error("Canvas capture failed");
      }

      const doc = new jsPDF("p", "mm", "a4");
      let y = drawHeader(doc);
      y = drawPatientInfo(doc, patient, y);
      y = drawVisualCards(doc, modelImage, chartImage, y);
      y = drawPainTable(doc, reportRows, y);
      y = drawSummary(doc, reportRows, y);

      if (y + 22 > PAGE.bottom - 10) {
        doc.addPage();
        y = drawHeader(doc);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(notesLabel, PAGE.left, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Doctor Name: ____________________", PAGE.left, y);
      doc.text("Signature: ____________________", PAGE.left + 72, y);
      doc.text("License No: ____________________", PAGE.left + 140, y);
      y += 8;
      doc.text(`Date: ${formatDate(new Date())}`, PAGE.left, y);

      drawFooter(doc);
      const fileSafeDate = new Date().toISOString().slice(0, 10);
      const fileName = `Pain_Report_${(patient?.fullName || "Patient").replace(/\s+/g, "_")}_${fileSafeDate}.pdf`;
      doc.save(fileName);
    } catch (err) {
      window.alert(err?.message || "Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-lg bg-[#1F4E79] px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#163A5F] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={exporting}
    >
      {exporting ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Exporting...
        </span>
      ) : (
        "Export PDF"
      )}
    </button>
  );
}
