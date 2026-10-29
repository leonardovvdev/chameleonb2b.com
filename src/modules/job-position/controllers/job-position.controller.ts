import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../core/contexts/auth.context";
import { listJobPositions } from "../services/job-position.service";
import type { JobPosition } from "../types/job-position.types";

const CARGOS_POR_PAGINA = 5;

export interface JobPositionFilters {
  busqueda: string;
}

export const FILTROS_JOBPOSITION_INICIALES: JobPositionFilters = {
  busqueda: "",
};

/**
 * Este hook hace 4 cosas, en este orden:
 *   1. TRAER    los cargos del backend.
 *   2. FILTRAR  según el texto de búsqueda.
 *   3. PAGINAR  (5 cargos por página).
 *   4. ENTREGAR a seccion_3 solo lo que necesita para dibujar la tabla.
 *
 * @param filtros    Texto de búsqueda (lo escribe el usuario en seccion_2).
 * @param recargaKey Cada vez que cambia este número se vuelve a pedir la lista
 *                   al backend (la página lo sube cuando seccion_1 crea un cargo).
 */
export const useJobPositionController = (
  filtros: JobPositionFilters,
  recargaKey = 0
) => {
  // El backend identifica al cliente por el JWT, no por custId.
  // Aquí solo sirve para saber si la sesión ya está lista.
  const { custId } = useAuth();
  const sesionLista = custId !== null;

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [todosLosCargos, setTodosLosCargos] = useState<JobPosition[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  // Página que pidió el usuario (puede quedar fuera de rango; ver paginaActual).
  const [paginaSolicitada, setPaginaSolicitada] = useState(1);

  // ─── 1. TRAER los cargos ───────────────────────────────────────────────────
  // Si el usuario dispara dos cargas seguidas, solo cuenta la última:
  // cada petición lleva un número y se descarta la respuesta si ya no es la más reciente.
  const numeroUltimaPeticion = useRef(0);

  const cargarCargosDesdeElBackend = useCallback(async () => {
    if (!sesionLista) return;

    const numeroDePeticion = ++numeroUltimaPeticion.current;
    setCargando(true);
    setMensajeError(null);

    try {
      const cargosRecibidos = await listJobPositions();
      if (numeroDePeticion !== numeroUltimaPeticion.current) return;
      setTodosLosCargos(cargosRecibidos);
    } catch (err) {
      if (numeroDePeticion !== numeroUltimaPeticion.current) return;
      console.error("Error al cargar cargos:", err);
      setMensajeError("No se pudo cargar la lista de cargos.");
    } finally {
      if (numeroDePeticion === numeroUltimaPeticion.current) setCargando(false);
    }
  }, [sesionLista]);

  // Carga al entrar y cada vez que cambia recargaKey.
  useEffect(() => {
    cargarCargosDesdeElBackend();
  }, [cargarCargosDesdeElBackend, recargaKey]);

  // ─── 2. FILTRAR por búsqueda ───────────────────────────────────────────────
  const textoBusqueda = filtros.busqueda.trim().toLowerCase();

  // Si el usuario escribe algo nuevo, volvemos a la página 1.
  const [textoBusquedaAnterior, setTextoBusquedaAnterior] = useState(textoBusqueda);
  if (textoBusquedaAnterior !== textoBusqueda) {
    setTextoBusquedaAnterior(textoBusqueda);
    setPaginaSolicitada(1);
  }

  const cargosQueCoincidenConLaBusqueda = useMemo(() => {
    if (textoBusqueda === "") return todosLosCargos;
    return todosLosCargos.filter(
      (cargo) =>
        cargo.name.toLowerCase().includes(textoBusqueda) ||
        (cargo.description ?? "").toLowerCase().includes(textoBusqueda)
    );
  }, [todosLosCargos, textoBusqueda]);

  // ─── 3. PAGINAR ────────────────────────────────────────────────────────────
  const totalPaginas = Math.max(
    1,
    Math.ceil(cargosQueCoincidenConLaBusqueda.length / CARGOS_POR_PAGINA)
  );

  // Si al eliminar se queda vacía la última página, retrocede sola.
  const paginaActual = Math.min(paginaSolicitada, totalPaginas);

  const cargosDeLaPaginaActual = useMemo(() => {
    const indiceInicial = (paginaActual - 1) * CARGOS_POR_PAGINA;
    return cargosQueCoincidenConLaBusqueda.slice(
      indiceInicial,
      indiceInicial + CARGOS_POR_PAGINA
    );
  }, [cargosQueCoincidenConLaBusqueda, paginaActual]);

  // ─── 4. ENTREGAR a seccion_3 ───────────────────────────────────────────────
  return {
    cargosDeLaPaginaActual,
    cargando,
    mensajeError,
    paginaActual,
    cambiarPagina: setPaginaSolicitada,
    totalPaginas,
    cargosPorPagina: CARGOS_POR_PAGINA,
    volverACargarCargos: cargarCargosDesdeElBackend,
  };
};