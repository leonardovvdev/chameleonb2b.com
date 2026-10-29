import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../core/contexts/auth.context";
import { supabase } from "../../../lib/supabase";
import { listStaff, setStaffActive } from "../../../core/services";
import type { StaffFilters, StaffListItem } from "../../../core/types";

const RETARDO_BUSQUEDA_MS = 150;
/** Páginas a cada lado de la actual que se piden y precargan por adelantado. */
const PAGINAS_PRECARGA = 2;
/** Tiempo que una página en caché se considera vigente. */
const TTL_CACHE_MS = 60_000;
/** Máximo de páginas guardadas (se descartan las más antiguas). */
const MAX_PAGINAS_CACHE = 120;
/** Si Realtime no está disponible, se revisa cada tanto mientras la pestaña está visible. */
const REFRESCO_AUTOMATICO_MS = 30_000;
/** Agrupa ráfagas de eventos en una sola consulta. */
const RETARDO_EVENTOS_MS = 400;

export const FILTROS_STAFF_INICIALES: StaffFilters = {
  busqueda: "",
  cargoId: null,
  rolId: null,
  estado: "",
};

interface PaginaStaff {
  data: StaffListItem[];
  count: number;
}

interface EntradaCache {
  pagina: PaginaStaff;
  guardadaEn: number;
}

/* ───────────────────────── Precarga de imágenes ─────────────────────────
 * Caché a nivel de módulo. Se guarda la referencia al <img> para que el
 * navegador no cancele la descarga.
 */
const imagenesPrecargadas = new Map<string, HTMLImageElement>();

const precargarImagen = (url: string) => {
  if (imagenesPrecargadas.has(url)) return;

  const img = new Image();
  img.decoding = "async";
  img.onerror = () => imagenesPrecargadas.delete(url); // permite reintentar
  img.src = url;
  imagenesPrecargadas.set(url, img);
};

const useValorConRetardo = <T>(valor: T, retardoMs: number): T => {
  const [valorConRetardo, setValorConRetardo] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setValorConRetardo(valor), retardoMs);
    return () => clearTimeout(id);
  }, [valor, retardoMs]);

  return valorConRetardo;
};

/**
 * @param itemsPorPagina filas por página; `null` mientras la vista aún no
 *                       midió la pantalla (no se consulta hasta tener el valor).
 */
export const useStaffController = (
  filtros: StaffFilters,
  itemsPorPagina: number | null
) => {
  const { custId } = useAuth();

  const [staffsPagina, setStaffsPagina] = useState<StaffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Identifica la última petición para descartar respuestas obsoletas.
  const ultimaPeticion = useRef(0);

  // Caché de páginas y peticiones en curso (evita pedir dos veces lo mismo).
  const cache = useRef(new Map<string, EntradaCache>());
  const pendientes = useRef(new Map<string, Promise<PaginaStaff>>());
  const grupoVigente = useRef("");

  // La búsqueda de texto se retrasa; los selects se aplican al instante.
  const busqueda = useValorConRetardo(filtros.busqueda.trim(), RETARDO_BUSQUEDA_MS);
  const { cargoId, rolId, estado } = filtros;

  const filtrosConsulta = useMemo<StaffFilters>(
    () => ({ busqueda, cargoId, rolId, estado }),
    [busqueda, cargoId, rolId, estado]
  );

  // Al cambiar los filtros volvemos a la página 1 (ajuste durante el render:
  // evita una consulta extra con la página anterior).
  const [filtrosPrevios, setFiltrosPrevios] = useState(filtrosConsulta);
  if (filtrosPrevios !== filtrosConsulta) {
    setFiltrosPrevios(filtrosConsulta);
    setPaginaActual(1);
    setMenuAbierto(null);
  }

  // Si cambian las filas por página, se conserva el primer registro visible.
  const [itemsPrevios, setItemsPrevios] = useState(itemsPorPagina);
  if (itemsPrevios !== itemsPorPagina) {
    setItemsPrevios(itemsPorPagina);
    setMenuAbierto(null);
    if (itemsPrevios !== null && itemsPorPagina !== null) {
      const primerIndice = (paginaActual - 1) * itemsPrevios;
      setPaginaActual(Math.floor(primerIndice / itemsPorPagina) + 1);
    }
  }

  // Las páginas guardadas solo valen para esta combinación de cliente,
  // filas por página y filtros.
  const grupo = useMemo(
    () => JSON.stringify([custId, itemsPorPagina, filtrosConsulta]),
    [custId, itemsPorPagina, filtrosConsulta]
  );

  const leerCache = useCallback(
    (pagina: number): PaginaStaff | null => {
      const entrada = cache.current.get(`${grupo}|${pagina}`);
      if (!entrada) return null;
      if (Date.now() - entrada.guardadaEn > TTL_CACHE_MS) return null;
      return entrada.pagina;
    },
    [grupo]
  );

  /** Devuelve una página desde caché, desde una petición en curso o del servidor. */
  const pedirPagina = useCallback(
    (pagina: number): Promise<PaginaStaff> => {
      if (custId === null || itemsPorPagina === null) {
        return Promise.reject(new Error("Contexto de consulta incompleto"));
      }

      const enCache = leerCache(pagina);
      if (enCache) return Promise.resolve(enCache);

      const clave = `${grupo}|${pagina}`;
      const enCurso = pendientes.current.get(clave);
      if (enCurso) return enCurso;

      const promesa = listStaff(pagina, itemsPorPagina, filtrosConsulta)
        .then(({ data, count }) => {
          const resultado: PaginaStaff = { data, count };

          // La clave incluye el grupo: volver a un filtro ya visto es instantáneo.
          cache.current.set(clave, { pagina: resultado, guardadaEn: Date.now() });
          if (cache.current.size > MAX_PAGINAS_CACHE) {
            const masAntigua = cache.current.keys().next().value;
            if (masAntigua !== undefined) cache.current.delete(masAntigua);
          }

          data.forEach((staff) => {
            if (staff.img_url) precargarImagen(staff.img_url);
          });

          return resultado;
        })
        .finally(() => pendientes.current.delete(clave));

      pendientes.current.set(clave, promesa);
      return promesa;
    },
    [custId, itemsPorPagina, filtrosConsulta, grupo, leerCache]
  );

  const cargarStaffs = useCallback(async (silencioso = false) => {
    if (custId === null || itemsPorPagina === null) return;

    grupoVigente.current = grupo;

    const peticion = ++ultimaPeticion.current;
    setError(null);

    const aplicar = (pagina: PaginaStaff) => {
      const total = Math.max(1, Math.ceil(pagina.count / itemsPorPagina));
      setStaffsPagina(pagina.data);
      setTotalPaginas(total);
      // La página pudo dejar de existir (menos registros o más filas por página).
      if (paginaActual > total) setPaginaActual(total);

      // Pide en segundo plano las páginas vecinas y precarga sus imágenes.
      for (let d = 1; d <= PAGINAS_PRECARGA; d++) {
        [paginaActual + d, paginaActual - d]
          .filter((p) => p >= 1 && p <= total)
          .forEach((p) => pedirPagina(p).catch(() => undefined));
      }
    };

    // Página ya guardada: se muestra al instante, sin estado de carga.
    const enCache = silencioso ? null : leerCache(paginaActual);
    if (enCache) {
      setLoading(false);
      aplicar(enCache);
      return;
    }

    // En modo silencioso la tabla sigue mostrando lo actual (sin "Cargando...").
    if (!silencioso) setLoading(true);

    try {
      const pagina = await pedirPagina(paginaActual);
      if (peticion !== ultimaPeticion.current) return;
      aplicar(pagina);
    } catch (err) {
      if (peticion !== ultimaPeticion.current) return;
      console.error("Error al cargar personales:", err);
      if (!silencioso) setError("No se pudo cargar la lista de personal.");
    } finally {
      if (peticion === ultimaPeticion.current && !silencioso) setLoading(false);
    }
  }, [custId, itemsPorPagina, grupo, paginaActual, leerCache, pedirPagina]);

  useEffect(() => {
    cargarStaffs();
  }, [cargarStaffs]);

  /**
   * Trae datos frescos sin parpadeo: descarta la caché pero deja visible la
   * tabla actual hasta que llega la respuesta.
   */
  const recargar = useCallback(() => {
    cache.current.clear();
    pendientes.current.clear();
    return cargarStaffs(true);
  }, [cargarStaffs]);

  // Siempre apunta a la última versión de `recargar` (para eventos y temporizadores).
  const recargarRef = useRef(recargar);
  useEffect(() => {
    recargarRef.current = recargar;
  }, [recargar]);

  // Nuevos registros / cambios hechos desde otra pestaña, dispositivo o usuario.
  useEffect(() => {
    if (custId === null) return;

    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const programar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => void recargarRef.current(), RETARDO_EVENTOS_MS);
    };

    const canal = supabase
      .channel(`staffs-lista-${custId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staffs", filter: `cust_id=eq.${custId}` },
        programar
      )
      .subscribe();

    // Respaldo por si Realtime no está habilitado para la tabla.
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") programar();
    }, REFRESCO_AUTOMATICO_MS);
    const alVolver = () => document.visibilityState === "visible" && programar();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      void supabase.removeChannel(canal);
    };
  }, [custId]);

  // Actualiza el estado en la lista visible y en las páginas guardadas.
  const actualizarActivoLocal = (stffId: number, activo: boolean) => {
    const aplicar = (lista: StaffListItem[]) =>
      lista.map((s) => (s.stff_id === stffId ? { ...s, stff_active: activo } : s));

    setStaffsPagina(aplicar);
    cache.current.forEach((entrada, clave) => {
      cache.current.set(clave, {
        ...entrada,
        pagina: { ...entrada.pagina, data: aplicar(entrada.pagina.data) },
      });
    });
  };

  /** Refleja una edición al instante en la fila visible y en las páginas guardadas. */
  const actualizarStaffLocal = useCallback(
    (stffId: number, cambios: Partial<StaffListItem>) => {
      const aplicar = (lista: StaffListItem[]) =>
        lista.map((s) => (s.stff_id === stffId ? { ...s, ...cambios } : s));

      setStaffsPagina(aplicar);
      cache.current.forEach((entrada, clave) => {
        cache.current.set(clave, {
          ...entrada,
          pagina: { ...entrada.pagina, data: aplicar(entrada.pagina.data) },
        });
      });
    },
    []
  );

  const toggleActivo = async (staff: StaffListItem) => {
    const nuevoEstado = !staff.stff_active;

    setError(null);
    setMenuAbierto(null);
    actualizarActivoLocal(staff.stff_id, nuevoEstado); // optimista

    try {
      await setStaffActive(staff.stff_id, nuevoEstado);
    } catch (err) {
      console.error("Error al cambiar estado del personal:", err);
      setError("No se pudo actualizar el estado. Intenta de nuevo.");
      actualizarActivoLocal(staff.stff_id, staff.stff_active); // revertir
    }
  };

  /** Termina el contrato (desactiva). Lanza el error del backend si no hay permiso. */
  const terminarContrato = async (staff: StaffListItem) => {
    await setStaffActive(staff.stff_id, false);
    actualizarActivoLocal(staff.stff_id, false);
  };

  return {
    staffsPagina,
    loading,
    error,
    menuAbierto,
    setMenuAbierto,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    toggleActivo,
    terminarContrato,
    actualizarStaffLocal,
    recargar,
  };
};