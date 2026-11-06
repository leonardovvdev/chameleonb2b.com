import { supabase } from "../../../lib/supabase"; // ← AJUSTA esta ruta a tu cliente de Supabase
import type {
  AttendanceReport,
  ContractOption,
  ReportRow,
  ReportSchedule,
  ReportSheet,
  ReportSummaryLine,
  StaffOption,
} from "../types/report.types";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/backend-chameleonb2b`;

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");

  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? "No se pudo completar la solicitud.");
  return body as T;
}

/* ───────────────────────── Consultas ───────────────────────── */

export async function fetchStaffOptions(search: string, signal?: AbortSignal): Promise<StaffOption[]> {
  const params = new URLSearchParams({ page: "1", pageSize: "50", search });
  const res = await request<{ items: StaffOption[] }>(`/staffs?${params}`, signal);
  return res.items;
}

/** Personal al azar que tenga al menos un contrato (para no abrir la pantalla vacía). Prefiere personal activo. */
export async function pickRandomStaff(signal?: AbortSignal): Promise<StaffOption | null> {
  const all = await fetchStaffOptions("", signal);
  const activos = all.filter((s) => s.stff_active);
  const pool = [...(activos.length ? activos : all)].sort(() => Math.random() - 0.5);

  for (const s of pool.slice(0, 6)) {
    const contratos = await fetchContracts(s.stff_id, signal);
    if (contratos.length > 0) return s;
  }
  return pool[0] ?? null;
}

/** Contratos en orden cronológico (el backend los entrega del más reciente al más antiguo). */

export async function fetchContracts(stffId: number, signal?: AbortSignal): Promise<ContractOption[]> {
  const res = await request<{ items: ContractOption[] }>(`/staff-contracts?stffId=${stffId}`, signal);
  return [...res.items].sort((a, b) => a.number - b.number);
}

export function fetchReport(stffId: number, contractId: number, signal?: AbortSignal): Promise<AttendanceReport> {
  return request<AttendanceReport>(`/attendance/report?stffId=${stffId}&contractId=${contractId}`, signal);
}

/* ───────────────────────── Formato ───────────────────────── */

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DAYS_UPPER = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

export const REPORT_HEADER = [
  "DÍAS TRABAJADOS", "DÍA", "FECHA", "HORA DE LLEGADA", "SALIDA ALMUERZO", "LLEGADA ALMUERZO",
  "HORA DE SALIDA", "TARDANZA DE LLEGADA", "DEMORA EN ALMUERZO", "ADELANTO EN EFECTIVO",
  "INCIDENCIAS", "OBSERVACIONES", "JUSTIFICACIÓN DE AUSENCIA", "JUSTIFICACIÓN DE TARDANZA",
  "JUSTIFICACIÓN DE DEMORA",
];

const DASH = "-";
const text = (v: string | null) => (v && v.trim() !== "" ? v.trim() : DASH);
const money = (n: number) => `S/ ${n.toFixed(2)}`;
const fmtDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Lima",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const fmtTime = (iso: string | null) => (iso ? timeFormat.format(new Date(iso)) : DASH);

function fmtMinutes(min: number | null): string {
  if (min === null) return DASH;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min`;
}

/** "8:00 AM" a partir de "HH:MM". */
function fmtHHMM(value: string | null): string {
  if (!value) return DASH;
  const [h, m] = value.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function scheduleText(schedule: ReportSchedule | null): string {
  if (!schedule) return DASH;

  if (schedule.type === "free") return "HORARIO LIBRE.";
  if (schedule.type === "flexible") {
    const hours = schedule.requiredMinutes ? fmtMinutes(schedule.requiredMinutes) : DASH;
    return `HORARIO FLEXIBLE: ${hours} POR DÍA.`;
  }

  const off = schedule.nonWorkingDays?.type === "fixed" ? schedule.nonWorkingDays.days : [];
  const working = DAYS_UPPER.map((name, i) => ({ name, i })).filter(({ i }) => !off[i]);
  const contiguous = working.length > 1 && working.every((d, k) => k === 0 || d.i === working[k - 1].i + 1);
  const days = contiguous
    ? `DE ${working[0].name} A ${working[working.length - 1].name}`
    : working.map((d) => d.name).join(", ");

  return `${days}: ${fmtHHMM(schedule.start)} A ${fmtHHMM(schedule.end)}.`;
}

/** Horario que rigió cada día de un mes (si cambió dentro del mes, una línea por tramo). */
function scheduleLineFor(report: AttendanceReport, monthRows: ReportRow[]): string {
  const periods = report.schedules ?? [];
  const used = [
    ...new Set(
      monthRows
        .map((r) => r.schedule_index)
        .filter((i): i is number => typeof i === "number" && !!periods[i]),
    ),
  ].sort((a, b) => a - b);

  if (used.length === 0) return `HORARIO LABORAL: ${scheduleText(report.schedule)}`;
  if (used.length === 1) return `HORARIO LABORAL: ${scheduleText(periods[used[0]].schedule)}`;

  const lines = used.map((i) => {
    const days = monthRows.filter((r) => r.schedule_index === i);
    const from = days[0].date;
    const to = days[days.length - 1].date;
    return `DEL ${fmtDate(from)} AL ${fmtDate(to)}: ${scheduleText(periods[i].schedule)}`;
  });
  return ["HORARIO LABORAL (CAMBIÓ DURANTE EL MES):", ...lines].join("\n");
}

/* ───────────────────────── Reporte → hojas (única fuente) ───────────────────────── */

function monthKeys(report: AttendanceReport): string[] {
  const first = report.rows[0]?.date;
  const last = report.rows[report.rows.length - 1]?.date;
  const start = report.contract.range_start ?? first;
  if (!start) return [];
  let end = report.contract.range_end ?? last ?? start;
  if (end < start) end = start;

  const keys: string[] = [];
  let y = Number(start.slice(0, 4));
  let m = Number(start.slice(5, 7));
  const endY = Number(end.slice(0, 4));
  const endM = Number(end.slice(5, 7));
  while ((y < endY || (y === endY && m <= endM)) && keys.length < 120) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return keys;
}

function rowCells(row: ReportRow, worked: number | null): string[] {
  const incidents = row.incidents.length
    ? row.incidents.map((i) => `${money(i.amount)} - ${i.description}`).join("\n")
    : DASH;

  return [
    worked === null ? DASH : String(worked),
    DAYS[new Date(`${row.date}T00:00:00Z`).getUTCDay()],
    fmtDate(row.date),
    fmtTime(row.arrival),
    fmtTime(row.refreshment_start),
    fmtTime(row.refreshment_end),
    fmtTime(row.departure),
    fmtMinutes(row.delay_minutes),
    fmtMinutes(row.refreshment_delay_minutes),
    row.advancement !== null ? money(row.advancement) : DASH,
    incidents,
    text(row.observation),
    text(row.justification_absence),
    text(row.justification_delay),
    text(row.justification_refreshment_delay),
  ];
}
/* ───────────────────────── Resumen de pago del mes ───────────────────────── */

const r2 = (n: number) => Math.round(n * 100) / 100;
const sumBy = <T,>(list: T[], pick: (item: T) => number) => list.reduce((acc, item) => acc + pick(item), 0);

const hhmmToMin = (value: string): number => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

/** Minutos que se trabajan por día: fijo = jornada - refrigerio; flexible = minutos requeridos; si no hay dato, 8 h. */
function minutesPerDay(schedule: ReportSchedule | null): number {
  const DEFAULT_MINUTES = 480;
  if (!schedule) return DEFAULT_MINUTES;

  if (schedule.type === "flexible") {
    return schedule.requiredMinutes && schedule.requiredMinutes > 0 ? schedule.requiredMinutes : DEFAULT_MINUTES;
  }
  if (schedule.type === "fixed" && schedule.start && schedule.end) {
    const r = schedule.refreshment;
    const rest = r ? (r.minutes ?? (r.start && r.end ? hhmmToMin(r.end) - hhmmToMin(r.start) : 0)) : 0;
    const net = hhmmToMin(schedule.end) - hhmmToMin(schedule.start) - Math.max(0, rest);
    return net > 0 ? net : DEFAULT_MINUTES;
  }
  return DEFAULT_MINUTES;
}

/** Cuadro de pago de UN mes: solo cuentan los días de ese mes. Los descuentos van en negativo. */
function buildSummary(report: AttendanceReport, monthRows: ReportRow[]): ReportSummaryLine[] {
  const c = report.contract;
  const salary = c.salary_amount;
  const dayRate = salary / 30; // pago de un día

  // El valor del minuto depende de la jornada del horario que rigió CADA día (puede cambiar dentro del mes).
  const periods = report.schedules ?? [];
  const scheduleOf = (r: ReportRow): ReportSchedule | null =>
    (r.schedule_index !== null && r.schedule_index !== undefined ? periods[r.schedule_index]?.schedule : undefined) ??
    report.schedule;
  const minuteRateOf = (r: ReportRow) => dayRate / minutesPerDay(scheduleOf(r));

  const absences = monthRows.filter((r) => r.is_absence).length;
  const delayMinutes = sumBy(monthRows, (r) => r.delay_minutes ?? 0);
  const refreshmentMinutes = sumBy(monthRows, (r) => r.refreshment_delay_minutes ?? 0);
  const advancements = r2(sumBy(monthRows, (r) => r.advancement ?? 0));
  const incidents = r2(sumBy(monthRows, (r) => sumBy(r.incidents, (i) => i.amount)));
  const afpPercent = c.afp_discount + c.insurance_premium;
  const afp = r2((salary * afpPercent) / 100);

  const rates = new Set(monthRows.map((r) => minuteRateOf(r).toFixed(4)));
  const mixedRates = rates.size > 1;
  const rateText = `S/ ${(rates.size === 1 ? [...rates][0] : (dayRate / minutesPerDay(report.schedule)).toFixed(4))} por min`;
  const calc = (minutes: number) =>
    mixedRates ? `${minutes} min (tarifa según el horario de cada día)` : `${minutes} min × ${rateText}`;

  const absenceDiscount = c.discount_absence ? r2(absences * dayRate) : 0;
  const delayDiscount = c.discount_delay ? r2(sumBy(monthRows, (r) => (r.delay_minutes ?? 0) * minuteRateOf(r))) : 0;
  const refreshmentDiscount = c.discount_refreshment_delay
    ? r2(sumBy(monthRows, (r) => (r.refreshment_delay_minutes ?? 0) * minuteRateOf(r)))
    : 0;

  const lines: ReportSummaryLine[] = [
    { kind: "base", label: "SUELDO DEL MES", detail: "Sueldo mensual del contrato", amount: r2(salary) },
    {
      kind: "discount",
      label: "FALTAS",
      detail: c.discount_absence
        ? `${absences} día(s) × ${money(dayRate)} (sueldo / 30)`
        : `${absences} día(s) - el contrato no las descuenta`,
      amount: -absenceDiscount,
    },
    {
      kind: "discount",
      label: "TARDANZA DE LLEGADA",
      detail: c.discount_delay ? calc(delayMinutes) : `${delayMinutes} min - el contrato no las descuenta`,
      amount: -delayDiscount,
    },
    {
      kind: "discount",
      label: "DEMORA EN ALMUERZO",
      detail: c.discount_refreshment_delay
        ? calc(refreshmentMinutes)
        : `${refreshmentMinutes} min - el contrato no las descuenta`,
      amount: -refreshmentDiscount,
    },
    { kind: "discount", label: "ADELANTOS", detail: "Total de adelantos del mes", amount: -advancements },
    { kind: "discount", label: "INCIDENCIAS", detail: "Total de incidencias (descuentos) del mes", amount: -incidents },
    {
      kind: "discount",
      label: "AFP",
      detail: `AFP ${c.afp_discount}% + seguro ${c.insurance_premium}% = ${r2(afpPercent)}% del sueldo`,
      amount: -afp,
    },
  ];

  const total = r2(lines.reduce((acc, l) => acc + l.amount, 0));
  lines.push({ kind: "total", label: "TOTAL A PAGAR", detail: "Sueldo menos todos los descuentos del mes", amount: total });
  return lines;
}

/** Una hoja por mes del contrato. La vista previa y el Excel usan exactamente este resultado. */
/** Una hoja por mes del contrato. La vista previa y el Excel usan exactamente este resultado. */
export function buildSheets(report: AttendanceReport): ReportSheet[] {
  const { staff, contract } = report;

  return monthKeys(report).map((key) => {
    let worked = 0;
    const monthRows = report.rows.filter((r) => r.date.startsWith(key));
    const rows = monthRows.map((r) => rowCells(r, r.is_worked ? ++worked : null));

    return {
      name: `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`,
      title: "ASISTENCIA DEL PERSONAL",
      staffLine: `${staff.lastname} ${staff.name}`.toUpperCase(),
      dniLine: `DNI: ${staff.dni}`,
      startLine: `INICIO LABORAL: ${contract.start_date ? fmtDate(contract.start_date) : "PENDIENTE"}`,
      endLine: `FIN LABORAL: ${contract.end_date ? fmtDate(contract.end_date) : "PENDIENTE"}`,
      scheduleLine: scheduleLineFor(report, monthRows),
      header: REPORT_HEADER,
      rows,
      summary: buildSummary(report, monthRows),
    };
  });
}

/* ───────────────────────── Excel ───────────────────────── */

const NAVY = "FF0F1B3D";
const BLUE = "FF1D4ED8";
const SOFT = "FFEFF6FF";
const WIDTHS = [11, 12, 12, 14, 14, 14, 14, 16, 16, 18, 42, 32, 30, 30, 30];

export async function downloadExcel(report: AttendanceReport): Promise<void> {
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;

  const sheets = buildSheets(report);
  const wb = new ExcelJS.Workbook();
  const border = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
  const allBorders = { top: border, left: border, bottom: border, right: border };
  const cols = WIDTHS.length;

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name);
    WIDTHS.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    const band = (row: number, from: number, to: number, value: string, opts: { bold?: boolean; size?: number; fill?: string; color?: string; align?: "center" | "left" } = {}) => {
      ws.mergeCells(row, from, row, to);
      const cell = ws.getCell(row, from);
      cell.value = value;
      cell.font = { bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: opts.color ?? "FF111827" } };
      cell.alignment = { vertical: "middle", horizontal: opts.align ?? "left", wrapText: true, indent: 1 };
      for (let c = from; c <= to; c++) {
        const target = ws.getCell(row, c);
        target.border = allBorders;
        if (opts.fill) target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
      }
    };

    band(1, 1, cols, sheet.title, { size: 16, fill: NAVY, color: "FFFFFFFF", align: "center" });
    band(2, 1, 8, sheet.staffLine, { fill: SOFT });
    band(2, 9, cols, sheet.dniLine, { fill: SOFT });
    band(3, 1, 8, sheet.startLine, { fill: SOFT });
    band(3, 9, cols, sheet.endLine, { fill: SOFT });
    band(4, 1, cols, sheet.scheduleLine, { fill: SOFT });
    ws.getRow(1).height = 30;
    ws.getRow(2).height = 22;
    ws.getRow(3).height = 22;
    ws.getRow(4).height = 22 * Math.max(1, sheet.scheduleLine.split("\n").length);

    const header = ws.getRow(5);
    sheet.header.forEach((label, i) => {
      const cell = header.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = allBorders;
    });
    header.height = 34;

    sheet.rows.forEach((cells, r) => {
      const row = ws.getRow(6 + r);
      cells.forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value;
        cell.border = allBorders;
        cell.font = { size: 10 };
        cell.alignment = { vertical: "middle", horizontal: i <= 9 ? "center" : "left", wrapText: true };
      });
    });

    // Cuadro de resumen de pago del mes: debajo de la tabla, separado por una fila vacía.
    const top = 6 + sheet.rows.length + 1;
    band(top, 1, 10, "RESUMEN DE PAGO DEL MES", { size: 12, fill: NAVY, color: "FFFFFFFF", align: "center" });
    band(top + 1, 1, 4, "CONCEPTO", { size: 10, fill: BLUE, color: "FFFFFFFF", align: "center" });
    band(top + 1, 5, 8, "DETALLE", { size: 10, fill: BLUE, color: "FFFFFFFF", align: "center" });
    band(top + 1, 9, 10, "MONTO", { size: 10, fill: BLUE, color: "FFFFFFFF", align: "center" });

    sheet.summary.forEach((line, i) => {
      const r = top + 2 + i;
      const isTotal = line.kind === "total";
      const fill = isTotal ? SOFT : undefined;
      band(r, 1, 4, line.label, { size: isTotal ? 12 : 10, fill });
      band(r, 5, 8, line.detail, { bold: false, size: 10, fill });
      band(r, 9, 10, "", { size: isTotal ? 12 : 10, fill });
      const amount = ws.getCell(r, 9);
      amount.value = line.amount;
      amount.numFmt = '"S/ "#,##0.00;[Red]-"S/ "#,##0.00';
      amount.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    });

    ws.views = [{ state: "frozen", ySplit: 5 }]; // título y encabezados visibles al desplazarse
  }

  if (sheets.length === 0) wb.addWorksheet("SIN REGISTROS");

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ASISTENCIA_${report.staff.lastname}_${report.staff.name}_CONTRATO_${report.contract.number}.xlsx`
    .replace(/\s+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
}

export async function fetchReportRow(
  stffId: number,
  contractId: number,
  date: string,
  signal?: AbortSignal,
): Promise<ReportRow | null> {
  const params = new URLSearchParams({ stffId: String(stffId), contractId: String(contractId), date });
  const res = await request<{ row: ReportRow | null }>(`/attendance/report/row?${params}`, signal);
  return res.row;
}