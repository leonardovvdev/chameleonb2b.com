import { useEffect, useState } from "react";
import { getOrgChartStaff } from "../services/organizational-chart.service";
import type { OrgChartStaff, OrgNode } from "../types/organizational-chart.types";

/**
 * Convierte la lista plana en un árbol.
 * Es raíz quien no tiene supervisor, quien tiene un supervisor que no está
 * en la lista (inactivo) y quien cerraría un ciclo (A supervisa a B y B a A).
 */
export function buildOrgTree(staff: OrgChartStaff[]): OrgNode[] {
  const nodes = new Map<number, OrgNode>();
  for (const s of staff) {
    nodes.set(s.id, {
      id: s.id,
      name: s.name,
      lastname: s.lastname,
      img_url: s.img_url,
      job_position: s.job_position,
      hijos: [],
    });
  }

  // id → id de su supervisor (null = raíz). Se asigna uno a uno comprobando
  // que no se forme un ciclo, así el resultado siempre es un bosque válido.
  const parentOf = new Map<number, number | null>();

  for (const s of staff) {
    const candidate =
      s.supervisor_id !== null && s.supervisor_id !== s.id && nodes.has(s.supervisor_id)
        ? s.supervisor_id
        : null;

    let closesCycle = false;
    let cursor: number | null = candidate;
    while (cursor !== null) {
      if (cursor === s.id) {
        closesCycle = true;
        break;
      }
      cursor = parentOf.get(cursor) ?? null;
    }

    parentOf.set(s.id, closesCycle ? null : candidate);
  }

  const roots: OrgNode[] = [];
  for (const s of staff) {
    const node = nodes.get(s.id)!;
    const parentId = parentOf.get(s.id) ?? null;
    if (parentId === null) roots.push(node);
    else nodes.get(parentId)!.hijos.push(node);
  }
  return roots;
}

export function useOrganizationalChartController() {
  const [arbol, setArbol] = useState<OrgNode[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    getOrgChartStaff()
      .then((staff) => {
        if (!cancelado) setArbol(buildOrgTree(staff));
      })
      .catch((err: unknown) => {
        console.error("ERROR AL CARGAR EL ORGANIGRAMA:", err);
        if (!cancelado) {
          setMensajeError(
            err instanceof Error ? err.message : "No se pudo cargar el organigrama.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return { arbol, cargando, mensajeError };
}