import type { Incidencia, StaffAttendance, StaffPendiente } from "./types/register.types";

/* ───────── Reglas de prueba (cámbialas a tu gusto) ───────── */
export const HORA_INGRESO = "08:00";
export const TOLERANCIA_MINUTOS = 5;
export const MAX_DESCRIPCION_AUSENCIA = 200;
/** Duración máxima del refrigerio (min). Pasada esta duración + tolerancia = tardanza de refrigerio. */
export const RECESO_MAXIMO_MINUTOS = 60;
export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * Valor por defecto de los descuentos (en la BD viene del contrato).
 * Cámbialos según lo que quieras probar.
 */
export const DESCUENTOS_POR_DEFECTO = {
  ausencia: true,
  tardanza: true,
  refrigerio: true,
};

/* ───────── Fechas ───────── */
const pad = (n: number): string => String(n).padStart(2, "0");

export const getHoyLocal = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const sumarDias = (fecha: string, dias: number): string => {
  const [y, m, d] = fecha.split("-").map(Number);
  const f = new Date(y, m - 1, d + dias);
  return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`;
};

/** "HH:MM" del día `fecha` (hora local) → ISO. */
const aIso = (fecha: string, hhmm?: string): string | null =>
  hhmm ? new Date(`${fecha}T${hhmm}:00`).toISOString() : null;

/* ───────── Catálogos ───────── */
export const CARGOS = [
  { id: 1, name: "Vendedor" },
  { id: 2, name: "Almacenero" },
  { id: 3, name: "Cajero" },
  { id: 4, name: "Administrador" },
];

export const ROLES = [
  { id: 1, name: "Empleado" },
  { id: 2, name: "Supervisor" },
];

/* ───────── Personal ───────── */
const persona = (
  stff_id: number,
  stff_name: string,
  stff_lastname: string,
  stff_dni: string,
  cargoId: number,
  rolId: number
): StaffPendiente => ({
  stff_id,
  stff_name,
  stff_lastname,
  stff_dni,
  img_url: null,
  job_position_id: cargoId,
  job_position_name: CARGOS.find((c) => c.id === cargoId)?.name ?? null,
  role_id: rolId,
  role_name: ROLES.find((r) => r.id === rolId)?.name ?? null,
});

export const staff: StaffPendiente[] = [
  persona(1, "Carlos", "Quispe Huamán", "45871236", 1, 1),
  persona(2, "María", "Flores Ramos", "46012358", 3, 1),
  persona(3, "Luis", "Rojas Cárdenas", "47123589", 2, 1),
  persona(4, "Ana", "Torres Vega", "44987123", 1, 1),
  persona(5, "Jorge", "Mendoza Ruiz", "45236987", 4, 2),
  persona(6, "Rosa", "Salazar Peña", "46598712", 3, 1),
  persona(7, "Pedro", "Castillo Díaz", "47852136", 2, 1),
  persona(8, "Lucía", "Paredes Soto", "45123698", 1, 1),
  persona(9, "Miguel", "Ortiz León", "46321458", 2, 1),
  persona(10, "Elena", "Vargas Cruz", "44785412", 1, 2),
  persona(11, "Diego", "Ramírez Chávez", "47412589", 3, 1),
  persona(12, "Sofía", "Herrera Ponce", "45896321", 1, 1),
];

/* ───────── Asistencias de prueba ───────── */
interface Spec {
  dias: number; // 0 = hoy, -1 = ayer...
  staff: number;
  ini?: string;
  iniR?: string;
  finR?: string;
  fin?: string;
  tard?: string;
  demora?: string;
  ausencia?: string;
  obs?: string;
  /** Sobrescribe el descuento por defecto de este registro. */
  descAusencia?: boolean;
  descTardanza?: boolean;
  descRefrigerio?: boolean;
}

const SPECS: Spec[] = [
  // Hoy
  { dias: 0, staff: 1, ini: "07:55", iniR: "12:30", finR: "13:30", fin: "17:00", obs: "Se quedó 10 minutos más para cerrar caja." },
  { dias: 0, staff: 2, ini: "08:20", iniR: "12:45", finR: "13:40" },
  { dias: 0, staff: 3, ini: "07:58" },
  { dias: 0, staff: 4, ausencia: "Permiso personal" },
  { dias: 0, staff: 5, ini: "08:03", iniR: "12:00", finR: "13:00", fin: "17:05" },
  // Ayer
  { dias: -1, staff: 1, ini: "08:00", iniR: "12:30", finR: "13:35", fin: "17:00" },
  { dias: -1, staff: 2, ini: "08:25", iniR: "12:40", finR: "13:50", fin: "17:10", tard: "Tráfico en la carretera", demora: "Fila en el banco" },
  { dias: -1, staff: 3, ini: "07:50", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -1, staff: 4, ini: "08:10", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -1, staff: 5, ini: "07:45", iniR: "12:00", finR: "13:00", fin: "17:00" },
  { dias: -1, staff: 6, ausencia: "Reunión familiar" },
  { dias: -1, staff: 7, ini: "07:59", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -1, staff: 8, ini: "08:40", iniR: "12:30", finR: "13:30", fin: "17:00" },
  // Hace 2 días
  { dias: -2, staff: 1, ini: "07:57", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -2, staff: 2, ini: "08:00", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -2, staff: 3, ini: "08:15", iniR: "12:30", finR: "13:30", fin: "17:00" },
  { dias: -2, staff: 5, ini: "07:50", iniR: "12:00", finR: "13:00", fin: "17:00" },
];

const hoyLocal = getHoyLocal();

export const asistencias: StaffAttendance[] = SPECS.map((s, i) => {
  const p = staff.find((x) => x.stff_id === s.staff)!;
  const fecha = sumarDias(hoyLocal, s.dias);
  return {
    att_id: i + 1,
    stff_id: p.stff_id,
    stff_name: p.stff_name,
    stff_lastname: p.stff_lastname,
    stff_dni: p.stff_dni,
    img_url: p.img_url,
    job_position_name: p.job_position_name,
    att_date: fecha,
    att_schedule_start: aIso(fecha, s.ini),
    att_refreshment_start: aIso(fecha, s.iniR),
    att_refreshment_end: aIso(fecha, s.finR),
    att_schedule_end: aIso(fecha, s.fin),
    att_justification_absence: s.ausencia ?? null,
    att_justification_delay: s.tard ?? null,
    att_justification_refreshment_delay: s.demora ?? null,
    att_discount_absence: s.descAusencia ?? DESCUENTOS_POR_DEFECTO.ausencia,
    att_discount_delay: s.descTardanza ?? DESCUENTOS_POR_DEFECTO.tardanza,
    att_discount_refreshment_delay: s.descRefrigerio ?? DESCUENTOS_POR_DEFECTO.refrigerio,
    att_observation: s.obs ?? null,
  };
});

/** Observaciones por att_id (derivadas de att_observation). */
export const observaciones: Record<number, string | null> = Object.fromEntries(
  asistencias
    .filter((a) => a.att_observation)
    .map((a) => [a.att_id, a.att_observation])
);

/** Incidencias por att_id. */
export const incidencias: Record<number, Incidencia[]> = {
  1: [
    {
      id: 1,
      amount: 20,
      description: "Faltante de caja al cierre.",
      created_by_staff_id: null,
      created_by_name: null,
      created_at: new Date().toISOString(),
    },
  ],
};

/* ───────── Adelantos ───────── */
export interface AdelantoLocal {
  id: number;
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  delivered_by_staff_id: number | null;
  delivered_by_name: string | null;
  amount: number;
  description: string | null;
  date: string;
}

/** 12 adelantos del staff 1 para probar "Ver más". */
export const adelantos: AdelantoLocal[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  stff_id: 1,
  stff_name: "Carlos",
  stff_lastname: "Quispe Huamán",
  delivered_by_staff_id: i % 2 === 0 ? null : 5,
  delivered_by_name: i % 2 === 0 ? null : "Jorge Mendoza Ruiz",
  amount: 50 + i * 10,
  description: i % 3 === 0 ? null : `Adelanto de prueba ${i + 1}`,
  date: sumarDias(hoyLocal, -i * 3),
}));

/** Quien "está autenticado" (null = Super admin). */
export const actor: { staffId: number | null; name: string | null } = {
  staffId: null,
  name: null,
};