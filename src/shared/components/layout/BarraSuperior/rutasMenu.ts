import type { ComponentType } from "react";
import { icon } from "../../../../core/icons";

export interface RutaMenu {
  ruta: string;
  migas: string[]; // de lo más general a lo más específico
  Icono: ComponentType<{ className?: string }>;
}

export const RUTAS_MENU: RutaMenu[] = [
  { ruta: "/list", migas: ["Gestión Empresarial", "Personal", "Lista"], Icono: icon.iconUsers },
  { ruta: "/organizational-chart", migas: ["Gestión Empresarial", "Personal", "Organigrama"], Icono: icon.iconOrganizationChart},
  { ruta: "/fotocheck", migas: ["Gestión Empresarial", "Personal", "Fotocheck"], Icono: icon.iconFotocheck },
  { ruta: "/job-position", migas: ["Gestión Empresarial", "Personal", "Cargo"], Icono: icon.iconJobPosition },
  { ruta: "/roles", migas: ["Gestión Empresarial", "Personal", "Rol"], Icono: icon.iconOfficeUser },
  { ruta: "/registers", migas: ["Gestión Empresarial", "Asistencia", "Registro"], Icono: icon.iconAttendance },
  { ruta: "/reports", migas: ["Gestión Empresarial", "Asistencia", "Reportes"], Icono: icon.iconStatistics },
  { ruta: "/storage", migas: ["Gestión Empresarial", "Almacenamiento"], Icono: icon.iconFile },

];