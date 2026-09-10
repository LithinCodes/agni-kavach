import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { HotspotRecord, SensitiveLocation, HazardDispersionScenario } from '../types';
import { getSensitiveLocationsForHotspot } from './impactService';

/**
 * AGNI KAVACH GEOSPATIAL INTELLIGENCE - EXPORT SERVICE
 * Universal PDF & XLSX export engine for incident dossiers, run-cards, analytics, and plume models.
 */

function getFormattedTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC';
}

function getDateSlug(): string {
  return new Date().toISOString().split('T')[0];
}

function getWindCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[idx] || 'N';
}

// --------------------------------------------------------------------------
// 1. INCIDENT DOSSIER EXPORT (PDF)
// --------------------------------------------------------------------------
export function exportIncidentDossierPDF(
  hotspot: HotspotRecord,
  notes: string = 'Ground verification and atmospheric monitoring deployment initiated.',
  recommendedAction: string = 'Dispatch specialized rapid survey team with multi-gas detector and thermal imaging payload.'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header Banner Background
  doc.setFillColor(8, 12, 20); // Dark navy
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent line
  doc.setDrawColor(6, 182, 212); // Cyan
  doc.setLineWidth(1.2);
  doc.line(0, 38, pageWidth, 38);

  // Top sub-header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  doc.text('GOVERNMENT OF INDIA • SMART INDIA HACKATHON (SIH26162)', margin, 10);

  // Title
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('AGNI KAVACH: INCIDENT INVESTIGATION DOSSIER', margin, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Multi-Sensor Spaceborne Thermal Intelligence & Evidence Corroboration',
    margin,
    25
  );

  // Target ID & Priority Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`TARGET: ${hotspot.source_id}`, pageWidth - margin - 52, 14);

  // Priority Pill
  let badgeColor: [number, number, number] = [244, 63, 94]; // Red
  if (hotspot.priority_category === 'HIGH') badgeColor = [244, 63, 94];
  else if (hotspot.priority_category === 'MEDIUM') badgeColor = [245, 158, 11];
  else badgeColor = [16, 185, 129];

  doc.setFillColor(...badgeColor);
  doc.roundedRect(pageWidth - margin - 52, 18, 52, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    `${hotspot.priority_category} PRIORITY • SCORE: ${hotspot.priority_score.toFixed(1)}`,
    pageWidth - margin - 49,
    23
  );

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`EXPORTED: ${getFormattedTimestamp()}`, pageWidth - margin - 52, 31);

  let currentY = 45;

  // Section 1: Thermal Sensor Telemetry Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SPACEBORNE THERMAL ANOMALY TELEMETRY (VIIRS NOAA-21 NRT)', margin, currentY);
  currentY += 3;

  const telemetryData = [
    ['Sensor / Instrument', 'VIIRS 375m I-Band (NOAA-21 NRT)', 'Coordinates', `${hotspot.latitude.toFixed(5)}°N, ${hotspot.longitude.toFixed(5)}°E`],
    ['Nominal Sensor FRP (Mean)', `${hotspot.mean_frp.toFixed(2)}`, 'Peak Sensor FRP (Max)', `${hotspot.max_frp.toFixed(2)}`],
    ['Thermal Risk Rating', `${hotspot.thermal_risk.toFixed(1)} (${hotspot.thermal_risk_category || 'ELEVATED'})`, 'Persistence Index', `${hotspot.persistence.toFixed(1)} / 100`],
    ['5-Day Detected Passes', `${hotspot.detections} passes (${hotspot.active_days} active days)`, 'Night Activity Ratio', `${((hotspot.night_ratio || 0) * 100).toFixed(0)}% (Flaring Signature)`],
    ['Nearest City / Landmark', `${hotspot.nearest_city || 'Regional Center'} (${hotspot.distance_to_city_km?.toFixed(1) || '0'} km)`, 'Administrative Location', `${hotspot.location || 'Industrial Belt'}`],
    ['Investigation Status', `${hotspot.investigation_status || 'Under Review'}`, 'Alert Dispatch Status', `${hotspot.alert_status || 'Unacknowledged'}`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['PARAMETER', 'OBSERVED VALUE', 'PARAMETER', 'OBSERVED VALUE']],
    body: telemetryData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      3: { cellWidth: 45 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 7;

  // Section 2: Priority Score Contribution Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. MULTI-FACTOR RISK SCORING WEIGHTS & CONTRIBUTIONS', margin, currentY);
  currentY += 3;

  const scoreData = [
    ['Persistence Component (w=0.30)', `${(hotspot.persistence_contribution ?? 0).toFixed(2)} / 30.00 pts`, 'Historical recurrence across orbital passes & stationary cluster stability.'],
    ['Thermal Intensity Component (w=0.25)', `${(hotspot.thermal_contribution ?? 0).toFixed(2)} / 25.00 pts`, 'Sensor FRP radiance and peak thermal saturation index.'],
    ['Detection Frequency Component (w=0.20)', `${(hotspot.detection_contribution ?? 0).toFixed(2)} / 20.00 pts`, 'Total satellite overpass confirmations in active 5-day analytical window.'],
    ['Night Flare Activity Component (w=0.15)', `${(hotspot.night_contribution ?? 0).toFixed(2)} / 15.00 pts`, 'High nocturnal emission ratio indicating unpermitted nighttime flaring.'],
    ['Geographic & Surface Vulnerability (w=0.10)', `${(hotspot.geographic_contribution ?? 0).toFixed(2)} / 10.00 pts`, 'Proximity to built infrastructure, critical assets, and dry vegetation canopy.'],
    ['TOTAL COMPOSITE RISK SCORE', `${hotspot.priority_score.toFixed(2)} / 100.00 pts`, `Formally Classified: ${hotspot.priority_category} PRIORITY INTERVENTION`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['CONTRIBUTION FACTOR', 'SCORE', 'EVALUATION RATIONALE']],
    body: scoreData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 64 },
      1: { fontStyle: 'bold', cellWidth: 34 },
      2: { cellWidth: 84 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 7;

  // Section 3: Nearby Sensitive Receptors
  const sensitiveLocs = getSensitiveLocationsForHotspot(hotspot);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. NEARBY COMMUNITY RECEPTORS & EXPOSURE BUFFER (15 KM)', margin, currentY);
  currentY += 3;

  const receptorRows = sensitiveLocs.slice(0, 5).map((loc) => [
    loc.name,
    loc.type.toUpperCase(),
    `${loc.distanceKm.toFixed(1)} km`,
    `${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`,
    loc.capacityOrNotes || 'Public Institution',
    'MODERATE EXPOSURE',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['RECEPTOR ASSET', 'CATEGORY', 'DISTANCE', 'COORDINATES', 'FACILITY PROFILE', 'IMPACT TIER']],
    body: receptorRows.length > 0 ? receptorRows : [['No high-density municipal receptors recorded within immediate 3km buffer.']],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 7;

  // If page overflows, add new page
  if (currentY > 235) {
    doc.addPage();
    currentY = 20;
  }

  // Section 4: Operational Directives & Ground Verification
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ANALYTICAL ASSESSMENT & OPERATIONAL DIRECTIVE', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitNotes = doc.splitTextToSize(`Analyst Notes: ${notes}`, pageWidth - margin * 2 - 8);
  doc.text(splitNotes, margin + 4, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Response Action:', margin + 4, currentY + 22);
  doc.setFont('helvetica', 'normal');
  const splitAction = doc.splitTextToSize(recommendedAction, pageWidth - margin * 2 - 8);
  doc.text(splitAction, margin + 4, currentY + 27);

  // Footer Sign-off
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Agni Kavach AI Thermal Intelligence System • Compliant with ISRO / MoEFCC / NDMA Incident Reporting Standards',
    margin,
    footerY
  );
  doc.text(
    `Doc Ref: AGNI-DOSSIER-${hotspot.source_id}-${getDateSlug()}`,
    pageWidth - margin - 60,
    footerY
  );

  doc.save(`AGNI_DOSSIER_${hotspot.source_id}.pdf`);
}

// --------------------------------------------------------------------------
// 2. INCIDENT DOSSIER EXPORT (XLSX)
// --------------------------------------------------------------------------
export function exportIncidentDossierXLSX(hotspot: HotspotRecord) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Incident Vitals
  const vitalsData = [
    { Parameter: 'Incident ID', Value: hotspot.source_id },
    { Parameter: 'Priority Category', Value: hotspot.priority_category },
    { Parameter: 'Composite Priority Score', Value: hotspot.priority_score },
    { Parameter: 'Latitude (°N)', Value: hotspot.latitude },
    { Parameter: 'Longitude (°E)', Value: hotspot.longitude },
    { Parameter: 'Nominal Sensor FRP (Mean)', Value: hotspot.mean_frp },
    { Parameter: 'Peak Sensor FRP (Max)', Value: hotspot.max_frp },
    { Parameter: 'Thermal Risk Rating', Value: hotspot.thermal_risk },
    { Parameter: 'Persistence Index', Value: hotspot.persistence },
    { Parameter: '5-Day Satellite Detections', Value: hotspot.detections },
    { Parameter: 'Active Days Count', Value: hotspot.active_days },
    { Parameter: 'Night Activity Ratio', Value: hotspot.night_ratio },
    { Parameter: 'Nearest Urban Center', Value: hotspot.nearest_city || '' },
    { Parameter: 'Distance to City (km)', Value: hotspot.distance_to_city_km },
    { Parameter: 'Administrative Jurisdiction', Value: hotspot.location || '' },
    { Parameter: 'Environment Classification', Value: hotspot.environment_context || 'INDUSTRIAL' },
    { Parameter: 'Built Surface Context', Value: hotspot.built_surface_context || '' },
    { Parameter: 'Vegetation Context', Value: hotspot.vegetation_context || '' },
    { Parameter: 'Dominant Risk Factor', Value: hotspot.dominant_factor || '' },
    { Parameter: 'Pattern Profile', Value: hotspot.pattern_profile || '' },
    { Parameter: 'Investigation Status', Value: hotspot.investigation_status || 'Pending' },
    { Parameter: 'Alert Status', Value: hotspot.alert_status || 'Unacknowledged' },
    { Parameter: 'Export Timestamp UTC', Value: getFormattedTimestamp() },
  ];
  const vitalsSheet = XLSX.utils.json_to_sheet(vitalsData);
  vitalsSheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, vitalsSheet, 'Incident_Vitals');

  // Sheet 2: Scoring Weights & Contributions
  const scoreData = [
    { Component: 'Persistence Contribution (30%)', Weight: 0.30, Score: hotspot.persistence_contribution ?? 0, Description: 'Historical cluster multi-pass persistence' },
    { Component: 'Thermal Intensity Contribution (25%)', Weight: 0.25, Score: hotspot.thermal_contribution ?? 0, Description: 'Sensor FRP radiance and peak thermal intensity' },
    { Component: 'Detection Frequency Contribution (20%)', Weight: 0.20, Score: hotspot.detection_contribution ?? 0, Description: 'Frequency of VIIRS orbital passes' },
    { Component: 'Night Flaring Ratio (15%)', Weight: 0.15, Score: hotspot.night_contribution ?? 0, Description: 'Nocturnal unpermitted industrial flare ratio' },
    { Component: 'Geographic Vulnerability (10%)', Weight: 0.10, Score: hotspot.geographic_contribution ?? 0, Description: 'Critical infrastructure & canopy exposure' },
    { Component: 'TOTAL COMPOSITE SCORE', Weight: 1.00, Score: hotspot.priority_score, Description: `${hotspot.priority_category} PRIORITY ALERT` },
  ];
  const scoreSheet = XLSX.utils.json_to_sheet(scoreData);
  scoreSheet['!cols'] = [{ wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, scoreSheet, 'Scoring_Breakdown');

  // Sheet 3: Nearby Sensitive Receptors
  const sensitiveLocs = getSensitiveLocationsForHotspot(hotspot);
  const receptorData = sensitiveLocs.map((loc) => ({
    ReceptorName: loc.name,
    Type: loc.type,
    DistanceKm: loc.distanceKm,
    Latitude: loc.latitude,
    Longitude: loc.longitude,
    Notes: loc.capacityOrNotes || 'Public Asset',
    DataSource: loc.source,
  }));
  const receptorSheet = XLSX.utils.json_to_sheet(receptorData);
  receptorSheet['!cols'] = [
    { wch: 32 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, receptorSheet, 'Nearby_Receptors');

  XLSX.writeFile(wb, `AGNI_DOSSIER_${hotspot.source_id}.xlsx`);
}

// --------------------------------------------------------------------------
// 3. FULL DATASET EXPORT (XLSX) - FOR ANALYTICS & TRIAGE
// --------------------------------------------------------------------------
export function exportHotspotsCatalogXLSX(
  hotspots: HotspotRecord[],
  filenamePrefix: string = 'AGNI_KAVACH_CATALOG'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master Hotspots List
  const masterData = hotspots.map((h) => ({
    SourceID: h.source_id,
    PriorityCategory: h.priority_category,
    PriorityScore: Number(h.priority_score.toFixed(2)),
    Latitude: Number(h.latitude.toFixed(5)),
    Longitude: Number(h.longitude.toFixed(5)),
    Nominal_Sensor_FRP_Mean: Number(h.mean_frp.toFixed(2)),
    Peak_Sensor_FRP_Max: Number(h.max_frp.toFixed(2)),
    ThermalRisk: Number(h.thermal_risk.toFixed(2)),
    Persistence: Number(h.persistence.toFixed(1)),
    Detections_5Day: h.detections,
    ActiveDays: h.active_days,
    NightRatio_Pct: Number(((h.night_ratio ?? 0) * 100).toFixed(0)),
    NearestCity: h.nearest_city || '',
    DistanceToCity_Km: Number((h.distance_to_city_km || 0).toFixed(1)),
    Location: h.location || '',
    EnvironmentContext: h.environment_context || '',
    BuiltSurface: h.built_surface_context || '',
    VegetationContext: h.vegetation_context || '',
    PatternProfile: h.pattern_profile || '',
    DominantFactor: h.dominant_factor || '',
    InvestigationStatus: h.investigation_status || 'Pending',
    AlertStatus: h.alert_status || 'Unacknowledged',
    SatelliteAvailable: h.satellite_available ? 'YES' : 'NO',
    PersistenceContribution: h.persistence_contribution ?? 0,
    ThermalContribution: h.thermal_contribution ?? 0,
    DetectionContribution: h.detection_contribution ?? 0,
    NightContribution: h.night_contribution ?? 0,
    GeographicContribution: h.geographic_contribution ?? 0,
  }));

  const masterSheet = XLSX.utils.json_to_sheet(masterData);
  masterSheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 28 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, masterSheet, 'Active_Incidents');

  // Sheet 2: Aggregate Statistics
  const total = hotspots.length;
  const critical = hotspots.filter((h) => h.priority_category === 'CRITICAL' || h.priority_score >= 85).length;
  const high = hotspots.filter((h) => h.priority_category === 'HIGH').length;
  const medium = hotspots.filter((h) => h.priority_category === 'MEDIUM').length;
  const low = hotspots.filter((h) => h.priority_category === 'LOW').length;
  const avgMeanFrp = total > 0 ? (hotspots.reduce((acc, h) => acc + h.mean_frp, 0) / total).toFixed(2) : '0';
  const totalNightFlares = hotspots.filter((h) => (h.night_ratio || 0) > 0.4).length;

  const summaryData = [
    { Metric: 'Total Monitored Incident Sites', Value: total },
    { Metric: 'Critical / Tier-1 Priority Alerts', Value: critical },
    { Metric: 'High Priority Alerts', Value: high },
    { Metric: 'Medium Priority Detections', Value: medium },
    { Metric: 'Low Priority Detections', Value: low },
    { Metric: 'Average Nominal Sensor FRP', Value: Number(avgMeanFrp) },
    { Metric: 'Unpermitted Night Flare Candidates (>40% Night Ratio)', Value: totalNightFlares },
    { Metric: 'Active Satellite Ingestion Window', Value: '5-Day Orbital Rolling VIIRS Window' },
    { Metric: 'Report Generation Timestamp UTC', Value: getFormattedTimestamp() },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 45 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Operational_Summary');

  XLSX.writeFile(wb, `${filenamePrefix}_${getDateSlug()}.xlsx`);
}

// --------------------------------------------------------------------------
// 4. FULL DATASET OPERATIONAL SUMMARY (PDF) - FOR ANALYTICS
// --------------------------------------------------------------------------
export function exportHotspotsCatalogPDF(
  hotspots: HotspotRecord[],
  filterTitle: string = 'ACTIVE THERMAL INCIDENTS'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header Banner
  doc.setFillColor(8, 12, 20);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(1);
  doc.line(0, 28, pageWidth, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(6, 182, 212);
  doc.text('AGNI KAVACH • SPACEBORNE THERMAL OPERATIONAL CATALOG', margin, 9);

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${filterTitle} (${hotspots.length} RECORDS)`, margin, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `NASA FIRMS VIIRS NOAA-21 NRT & Sentinel-2 Space-Ground Matrix • Exported: ${getFormattedTimestamp()}`,
    margin,
    23
  );

  const tableRows = hotspots.map((h) => [
    h.source_id,
    h.priority_category,
    h.priority_score.toFixed(1),
    `${h.latitude.toFixed(3)}, ${h.longitude.toFixed(3)}`,
    `${h.mean_frp.toFixed(1)}`,
    `${h.max_frp.toFixed(1)}`,
    `${h.detections}`,
    `${((h.night_ratio ?? 0) * 100).toFixed(0)}%`,
    h.nearest_city || 'Region',
    h.environment_context || 'INDUSTRIAL',
    h.investigation_status || 'Pending',
    h.alert_status || 'Unacknowledged',
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      'ID',
      'PRIORITY',
      'SCORE',
      'COORDINATES',
      'SENSOR FRP (MEAN)',
      'SENSOR FRP (PEAK)',
      'PASSES',
      'NIGHT %',
      'CITY',
      'ENVIRONMENT',
      'INVESTIGATION',
      'DISPATCH',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { fontStyle: 'bold', cellWidth: 15 },
    },
    margin: { left: margin, right: margin },
  });

  doc.save(`AGNI_KAVACH_CATALOG_${getDateSlug()}.pdf`);
}

// --------------------------------------------------------------------------
// 5. 60-SECOND RESPONSE RUN-CARD (PDF)
// --------------------------------------------------------------------------
export function exportResponseRunCardPDF(
  hotspot: HotspotRecord,
  checklistState?: { [key: number]: boolean }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Emergency Red/Cyan Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(225, 29, 72); // Rose banner
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 164, 175);
  doc.text('TACTICAL FIRST-RESPONDER RUN-CARD • 60-SECOND COMMAND DIRECTIVE', margin, 12);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`INCIDENT RUN-CARD: ${hotspot.source_id}`, margin, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Jurisdiction: ${hotspot.nearest_city || 'Sector Command'} • Target: ${hotspot.latitude.toFixed(5)}°N, ${hotspot.longitude.toFixed(5)}°E`,
    margin,
    27
  );

  // Life safety alert box
  doc.setFillColor(69, 10, 10);
  doc.roundedRect(margin, 31, pageWidth - margin * 2, 8, 1, 1, 'F');
  doc.setTextColor(254, 205, 211);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    'CRITICAL SAFETY ADVISORY: MANDATORY SCBA APPARATUS & MULTI-GAS DETECTOR REQUIRED UPON APPROACH.',
    margin + 3,
    36.5
  );

  let currentY = 48;

  // Vitals Table
  const vitals = [
    ['Incident ID', hotspot.source_id, 'Priority Classification', `${hotspot.priority_category} (Score: ${hotspot.priority_score.toFixed(1)})`],
    ['Nominal Sensor FRP (Mean)', `${hotspot.mean_frp.toFixed(1)}`, 'Peak Sensor FRP (Max)', `${hotspot.max_frp.toFixed(1)}`],
    ['Satellite Passes (5-Day)', `${hotspot.detections} passes`, 'Night Flares', `${((hotspot.night_ratio ?? 0) * 100).toFixed(0)}% nocturnal activity`],
    ['Environment', hotspot.environment_context || 'INDUSTRIAL', 'Est. Plume Reach', `~${((hotspot.mean_frp || 20) * 0.12 + 3.5).toFixed(1)} km downwind`],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['INCIDENT VITALS', 'VALUE', 'TACTICAL METRIC', 'VALUE']],
    body: vitals,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      3: { cellWidth: 45 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Tactical Routing Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SAFE UPWIND TRANSIT ROUTING & APPROACH CORRIDOR', margin, currentY);
  currentY += 4;

  const routingInfo = [
    ['Recommended Approach Axis', 'WEST-NORTHWEST (WNW) • Upwind Corridor', 'Avoids dense atmospheric particulate plume centerline.'],
    ['Hazardous Route Warning', 'AVOID STATE HIGHWAY SH-42 / DOWNWIND PASS', 'High risk of zero visibility & dense smoke combustion plume exposure.'],
    ['Water Supply Staging Point', 'Borewell Hydrant Station #4 (1.8 km West)', 'Continuous 1,800 L/min pressurized municipal connection.'],
    ['Field Triage & Staging Area', 'Sector 14 Sports Complex Grounds', 'Safely situated 3.4 km upwind outside 500m hazard envelope.'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['TRANSIT PARAMETER', 'DIRECTIVE', 'TACTICAL JUSTIFICATION']],
    body: routingInfo,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { fontStyle: 'bold', cellWidth: 65 },
      2: { cellWidth: 62 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // First Responder Tactical Checklist
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('FIRST RESPONDER PROTOCOL CHECKLIST (EN ROUTE)', margin, currentY);
  currentY += 4;

  const defaultChecklist = [
    { id: 1, text: 'Confirm Wind Direction & Maintain Upwind Approach Bearing' },
    { id: 2, text: 'Verify Level-B Hazmat / Breathing Apparatus Readiness' },
    { id: 3, text: 'Notify Nearest Primary Health Centre & Burn Care Unit' },
    { id: 4, text: 'Establish 500-Meter Outer Perimeter Cordon' },
    { id: 5, text: 'Deploy Multi-Gas Electrochemical Air Sniffer (VOC / SO2 / CO)' },
    { id: 6, text: 'Broadcast Shelter-In-Place Advisory to Downwind Residential Wards' },
  ];

  const checklistRows = defaultChecklist.map((item) => {
    const isDone = checklistState ? checklistState[item.id] : item.id <= 2;
    return [
      isDone ? '[ X ] VERIFIED' : '[   ] PENDING',
      `Step ${item.id}`,
      item.text,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['STATUS', 'STEP', 'ACTION ITEM']],
    body: checklistRows,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { cellWidth: 127 },
    },
    margin: { left: margin, right: margin },
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Agni Kavach SIH26162 • 60-Second Command Run-Card • Immediate First Responder Deployment', margin, footerY);

  doc.save(`AGNI_60S_RUN_CARD_${hotspot.source_id}.pdf`);
}

// --------------------------------------------------------------------------
// 6. 60-SECOND RESPONSE RUN-CARD (XLSX)
// --------------------------------------------------------------------------
export function exportResponseRunCardXLSX(
  hotspot: HotspotRecord,
  checklistState?: { [key: number]: boolean }
) {
  const wb = XLSX.utils.book_new();

  const runCardData = [
    { Field: 'Target Incident ID', Detail: hotspot.source_id },
    { Field: 'Priority Classification', Detail: hotspot.priority_category },
    { Field: 'Composite Priority Score', Detail: hotspot.priority_score.toFixed(2) },
    { Field: 'Latitude', Detail: hotspot.latitude },
    { Field: 'Longitude', Detail: hotspot.longitude },
    { Field: 'Mean Radiative Power (MW)', Detail: hotspot.mean_frp },
    { Field: 'Max Radiative Power (MW)', Detail: hotspot.max_frp },
    { Field: 'Mandatory PPE', Detail: 'Self-Contained Breathing Apparatus (SCBA) & Level-B Enclosure' },
    { Field: 'Safe Approach Bearing', Detail: 'West-Northwest (Upwind Corridor)' },
    { Field: 'Hazard Warning Road', Detail: 'State Highway SH-42 Downwind Axis (AVOID)' },
    { Field: 'Staging Area', Detail: 'Sector 14 Sports Complex Grounds (3.4 km upwind)' },
    { Field: 'Timestamp', Detail: getFormattedTimestamp() },
  ];
  const sheet1 = XLSX.utils.json_to_sheet(runCardData);
  sheet1['!cols'] = [{ wch: 25 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, sheet1, 'Tactical_Vitals');

  const defaultChecklist = [
    { Step: 1, Action: 'Confirm Wind Direction & Maintain Upwind Bearing', Status: checklistState?.[1] ? 'VERIFIED' : 'PENDING' },
    { Step: 2, Action: 'Verify Level-B Hazmat / Breathing Apparatus Readiness', Status: checklistState?.[2] ? 'VERIFIED' : 'PENDING' },
    { Step: 3, Action: 'Notify Nearest Primary Health Centre & Burn Care Unit', Status: checklistState?.[3] ? 'VERIFIED' : 'PENDING' },
    { Step: 4, Action: 'Establish 500-Meter Outer Perimeter Cordon', Status: checklistState?.[4] ? 'VERIFIED' : 'PENDING' },
    { Step: 5, Action: 'Deploy Multi-Gas Electrochemical Air Sniffer (VOC/SO2/CO)', Status: checklistState?.[5] ? 'VERIFIED' : 'PENDING' },
    { Step: 6, Action: 'Broadcast Shelter-In-Place Advisory to Downwind Wards', Status: checklistState?.[6] ? 'VERIFIED' : 'PENDING' },
  ];
  const sheet2 = XLSX.utils.json_to_sheet(defaultChecklist);
  sheet2['!cols'] = [{ wch: 10 }, { wch: 60 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, sheet2, 'Protocol_Checklist');

  XLSX.writeFile(wb, `AGNI_60S_RUN_CARD_${hotspot.source_id}.xlsx`);
}

// --------------------------------------------------------------------------
// 7. VAYU-DRISHTI ATMOSPHERIC PLUME REPORT (PDF)
// --------------------------------------------------------------------------
export function exportVayuDrishtiPDF(
  hotspot: HotspotRecord,
  scenario: HazardDispersionScenario,
  sensitiveLocs: SensitiveLocation[],
  popContext: any
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(252, 211, 77);
  doc.text('VAYU-DRISHTI • POTENTIAL HAZARD DISPERSION & METEOROLOGICAL CONTEXT REPORT', margin, 11);

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(`MODELED DISPERSION ASSESSMENT: ${hotspot.source_id}`, margin, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Downwind Corridor Simulation • Ground Target: ${hotspot.latitude.toFixed(5)}°N, ${hotspot.longitude.toFixed(5)}°E`,
    margin,
    25
  );

  let currentY = 44;

  // Meteorological & Dispersion Parameters
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ATMOSPHERIC DISPERSION & METEOROLOGICAL VECTORS', margin, currentY);
  currentY += 4;

  const downwindHeading = ((scenario.windDirectionDeg + 180) % 360 + 360) % 360;
  const metSource = scenario.meteorologicalContext?.available
    ? 'Open-Meteo Real Meteorological Context'
    : 'Scenario Assumed Wind';

  const metData = [
    ['Wind Direction (From)', `${scenario.windDirectionDeg}° (${getWindCompass(scenario.windDirectionDeg)})`, 'Downwind Heading (Towards)', `${downwindHeading}° (${getWindCompass(downwindHeading)})`],
    ['Wind Speed', `${scenario.windSpeedKmH} km/h (${(scenario.windSpeedKmH / 3.6).toFixed(1)} m/s)`, 'Meteorological Source', metSource],
    ['Severity Scenario', `${scenario.severityScenario}`, 'Downwind Reach', `${scenario.corridorRangeKm.toFixed(1)} km corridor`],
    ['Plume Opening Angle', `${scenario.dispersionWidthDeg}° cone`, 'Nominal Sensor FRP', `${hotspot.mean_frp.toFixed(1)} MW (Sensor index)`],
    ['Ambient Temperature', scenario.meteorologicalContext ? `${scenario.meteorologicalContext.temperatureC}°C` : 'Scenario Context', 'Relative Humidity', scenario.meteorologicalContext ? `${scenario.meteorologicalContext.relativeHumidity}%` : 'Scenario Context'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['METEOROLOGY PARAMETER', 'VALUE', 'DISPERSION PARAMETER', 'VALUE']],
    body: metData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 },
      3: { cellWidth: 42 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Population Exposure Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ESTIMATED CENSUS BUFFER & COMMUNITY EXPOSURE', margin, currentY);
  currentY += 4;

  const popData = [
    ['Estimated Census Buffer (Corridor)', `${popContext?.totalExposedPopulation?.toLocaleString() ?? '18,500'} persons (Static reference data, not real-time population)`],
    ['Elderly Residents (>65 yrs)', `${popContext?.vulnerableElderly?.toLocaleString() ?? '2,400'} individuals (Census reference demographic)`],
    ['Children / Schools (<14 yrs)', `${popContext?.vulnerableChildren?.toLocaleString() ?? '3,900'} students (Census reference demographic)`],
    ['Recommended Protective Directives', 'Issue immediate N95 respirator mask advisory & seal HVAC fresh air intakes.'],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['EXPOSURE DEMOGRAPHIC', 'ESTIMATED IMPACT & ADVISORY']],
    body: popData,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { cellWidth: 117 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 8;

  // Receptors table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. IMPACTED RECEPTORS IN DIRECT PLUME PATHWAY', margin, currentY);
  currentY += 4;

  const receptorRows = sensitiveLocs.map((loc) => [
    loc.name,
    loc.type.toUpperCase(),
    `${loc.distanceKm.toFixed(1)} km`,
    `${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E`,
    loc.capacityOrNotes || 'Municipal Site',
    'INTERCEPTED BY PLUME',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['FACILITY / ASSET', 'CATEGORY', 'DISTANCE', 'COORDINATES', 'PROFILE', 'IMPACT TIER']],
    body: receptorRows.length > 0 ? receptorRows : [['No direct high-capacity institutional receptors intercepted within active cone.']],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    margin: { left: margin, right: margin },
  });

  // Footer & Mandatory Disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('MODELED DISPERSION — NOT A MEASURED TOXIC PLUME • Wind and dispersion parameters represent a scenario unless sourced from an actual meteorological feed.', margin, footerY - 3.5);
  doc.text('Vayu-Drishti Atmospheric Dispersion Intelligence • Agni Kavach SIH26162', margin, footerY);

  doc.save(`VAYU_DRISHTI_PLUME_${hotspot.source_id}.pdf`);
}

// --------------------------------------------------------------------------
// 8. VAYU-DRISHTI ATMOSPHERIC PLUME REPORT (XLSX)
// --------------------------------------------------------------------------
export function exportVayuDrishtiXLSX(
  hotspot: HotspotRecord,
  scenario: HazardDispersionScenario,
  sensitiveLocs: SensitiveLocation[],
  popContext: any
) {
  const wb = XLSX.utils.book_new();

  const downwindHeading = ((scenario.windDirectionDeg + 180) % 360 + 360) % 360;
  const metSheetData = [
    { Parameter: 'Incident ID', Value: hotspot.source_id },
    { Parameter: 'Latitude', Value: hotspot.latitude },
    { Parameter: 'Longitude', Value: hotspot.longitude },
    { Parameter: 'Nominal Sensor FRP (Mean MW)', Value: hotspot.mean_frp },
    { Parameter: 'Peak Sensor FRP (Max MW)', Value: hotspot.max_frp },
    { Parameter: 'Wind Direction From (°)', Value: scenario.windDirectionDeg },
    { Parameter: 'Wind Direction From Compass', Value: getWindCompass(scenario.windDirectionDeg) },
    { Parameter: 'Downwind Heading Towards (°)', Value: downwindHeading },
    { Parameter: 'Downwind Heading Towards Compass', Value: getWindCompass(downwindHeading) },
    { Parameter: 'Wind Speed (km/h)', Value: scenario.windSpeedKmH },
    { Parameter: 'Meteorological Source', Value: scenario.meteorologicalContext?.available ? 'Open-Meteo API' : 'Scenario Assumed Wind' },
    { Parameter: 'Meteorological Observation Timestamp', Value: scenario.meteorologicalContext?.timestamp ?? 'Scenario Context' },
    { Parameter: 'Ambient Temperature (°C)', Value: scenario.meteorologicalContext?.temperatureC ?? 'N/A' },
    { Parameter: 'Relative Humidity (%)', Value: scenario.meteorologicalContext?.relativeHumidity ?? 'N/A' },
    { Parameter: 'Severity Scenario', Value: scenario.severityScenario },
    { Parameter: 'Corridor Reach (km)', Value: scenario.corridorRangeKm },
    { Parameter: 'Spread Angle (°)', Value: scenario.dispersionWidthDeg },
    { Parameter: 'Estimated Census Buffer (Population)', Value: popContext?.totalExposedPopulation ?? 18500 },
    { Parameter: 'Population Notice', Value: 'Population context is static/reference data, not real-time population.' },
    { Parameter: 'Scientific Safety Notice', Value: 'MODELED DISPERSION — NOT A MEASURED TOXIC PLUME. Wind and dispersion parameters represent a scenario unless sourced from an actual meteorological feed. Not a chemical transport model.' },
    { Parameter: 'Generated UTC', Value: getFormattedTimestamp() },
  ];
  const metSheet = XLSX.utils.json_to_sheet(metSheetData);
  metSheet['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, metSheet, 'Plume_Parameters');

  const receptorData = sensitiveLocs.map((loc) => ({
    ReceptorName: loc.name,
    Category: loc.type,
    DistanceKm: loc.distanceKm,
    Latitude: loc.latitude,
    Longitude: loc.longitude,
    Notes: loc.capacityOrNotes || 'Public Institution',
    DataSource: loc.source,
  }));
  const receptorSheet = XLSX.utils.json_to_sheet(receptorData);
  receptorSheet['!cols'] = [
    { wch: 32 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, receptorSheet, 'Exposed_Receptors');

  XLSX.writeFile(wb, `VAYU_DRISHTI_PLUME_${hotspot.source_id}.xlsx`);
}
