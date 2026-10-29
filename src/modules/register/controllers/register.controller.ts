import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../core/contexts/auth.context";
import { getCustomerJobPositions, getCustomerRoles } from "../../../core/services/catalog.service";
import type { CustomerJobPosition, CustomerRole } from "../../../core/types";
import {
  createIncident,
  deleteAttendance,
  getAttendanceByDate,
  getAttendanceDetail,
  getIncidents,
  getPendingAbsence,
  getPendingCheckIn,
  registerAbsence,
  registerCheckIn,
} from "../services/register.service";
import type {
  ActualizarFiltro,
  EstadoAsistencia,
  IncidenciaDescuento,
  ModoRegistro,
  NuevoRegistroControl,
  RegisterFilters,
  RegisterSummary,
  RegistroDetalle,
  StaffAttendance,
  StaffPendiente,
} from "../types/register.types";

const SEGUNDOS_RESALTADO = 3;
const MS_ESPERA_BUSQUEDA = 300;
const MAX_DESCRIPCION_AUSENCIA = 200; // = VARCHAR(200) de att_justification_absence
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
/* ═════════════════════════════════════════════════════════════════════════════
 * Funciones de apoyo (antes en register.helpers.ts).
 * seccion_3 y seccion_4 las importan desde este mismo archivo.
 * ═════════════════════════════════════════════════════════════════════════════ */

/* ───────── Fechas ───────── */

/** Fecha de HOY en hora local (no en UTC), formato YYYY-MM-DD. */
export const getFechaLocalHoy = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** "2026-10-26" → "26 Oct 2026" (con "Hoy, " delante si es hoy). */
export const textoFecha = (fecha: string, esHoy: boolean): string => {
  const [year, month, day] = fecha.split("-").map(Number);
  const texto = `${day} ${MESES[month - 1] ?? ""} ${year}`;
  return esHoy ? `Hoy, ${texto}` : texto;
};

/* ───────── Horas ───────── */

// PostgREST puede devolver "2026-10-26 13:05:00+00": se normaliza a ISO 8601
// para que todos los navegadores (Safari incluido) lo entiendan.
const normalizarTimestamp = (valor: string) =>
  valor.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");

/**
 * Minutos desde las 00:00 en la HORA LOCAL del dispositivo.
 *  - timestamptz ("2026-10-26T13:05:00+00:00"): new Date() lo convierte de UTC a hora local.
 *  - time sin fecha ("08:05:00", como stff_schdl_start): se toma tal cual.
 */
export const aMinutos = (valor: string | null): number | null => {
  if (!valor) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    const fecha = new Date(normalizarTimestamp(valor));
    return Number.isNaN(fecha.getTime()) ? null : fecha.getHours() * 60 + fecha.getMinutes();
  }

  const m = valor.match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** "08:05 a. m." (hora local) o null si no hay valor. */
export const formatHora = (valor: string | null): string | null => {
  const min = aMinutos(valor);
  if (min === null) return null;
  const h = Math.floor(min / 60);
  const mm = min % 60;
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${sufijo}`;
};

export const formatDuracion = (min: number): string =>
  `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

/* ───────── Cálculos de una fila ───────── */

/** Total R = receso = fin de receso − inicio de receso. */
export const minutosReceso = (a: StaffAttendance): number | null => {
  const ini = aMinutos(a.att_inicio_receso);
  const fin = aMinutos(a.att_fin_receso);
  if (ini === null || fin === null || fin < ini) return null;
  return fin - ini;
};

/** Total L = (fin de jornada − inicio de jornada) − receso. */
export const minutosLaborados = (a: StaffAttendance): number | null => {
  const ini = aMinutos(a.att_inicio_jornada);
  const fin = aMinutos(a.att_fin_jornada);
  if (ini === null || fin === null || fin < ini) return null;
  const receso = minutosReceso(a) ?? 0;
  return Math.max(0, fin - ini - receso);
};

/**
 * - null: todavía no registró ingreso.
 * - "tardanza": horario fijo y llegó después de (inicio + tolerancia).
 * - "puntual": llegó a tiempo, o su horario no exige hora de inicio (flexible / libre).
 */
export const getEstado = (a: StaffAttendance): EstadoAsistencia => {
  const ingreso = aMinutos(a.att_inicio_jornada);
  if (ingreso === null) return null;

  const inicioHorario = a.schedule_type === "fixed" ? aMinutos(a.schedule_start) : null;
  if (inicioHorario === null) return "puntual";

  return ingreso > inicioHorario + (a.schedule_tolerance ?? 0) ? "tardanza" : "puntual";
};

/** Incidencias = justificaciones registradas (ausencia, demora, demora de refrigerio). */
export const getIncidentes = (a: StaffAttendance): number =>
  [
    a.att_justification_absence,
    a.att_justification_delay,
    a.att_justification_refreshment_delay,
  ].filter((justificacion) => justificacion && justificacion.trim() !== "").length;

/** Huella de las horas de una fila: sirve para detectar qué fila cambió. */
export const firmaRegistro = (a: StaffAttendance): string =>
  [a.att_inicio_jornada, a.att_inicio_receso, a.att_fin_receso, a.att_fin_jornada].join("|");

/** Minúsculas y sin tildes, para buscar sin importar acentos. */
export const normalizarTexto = (texto: string): string =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const mensajeDe = (error: unknown, porDefecto: string): string =>
  error instanceof Error ? error.message : porDefecto;

/* ═════════════════════════════════════════════════════════════════════════════
 * Caché en memoria. Vive FUERA del componente, así que sobrevive cuando el usuario
 * se va a otra página y vuelve: la tabla aparece al instante con lo último que se
 * vio y se refresca en segundo plano (sin "Cargando...").
 * Se vacía sola si cambia el usuario o se cierra la sesión.
 * ═════════════════════════════════════════════════════════════════════════════ */
const MAX_FECHAS_EN_CACHE = 14;
const MS_FOTO_VIGENTE = 50 * 60 * 1000; // las URLs firmadas del backend duran 60 min

const cache = {
  userId: null as string | null,
  asistencia: new Map<string, { items: StaffAttendance[]; total: number }>(), // fecha → datos
  fotos: new Map<number, { url: string; ts: number }>(), // stff_id → URL firmada
  cargos: null as CustomerJobPosition[] | null,
  roles: null as CustomerRole[] | null,
  detalles: new Map<number, RegistroDetalle>(), // att_id → detalle del modal
  incidencias: new Map<number, IncidenciaDescuento[]>(), // att_id → incidencias
};

const usarCacheDe = (userId: string | null) => {
  if (cache.userId === userId) return;
  cache.userId = userId;
  cache.asistencia.clear();
  cache.fotos.clear();
  cache.cargos = null;
  cache.roles = null;
  cache.detalles.clear();
  cache.incidencias.clear();
};

const rutaDeFoto = (url: string) => url.split("?")[0];

/**
 * Cada consulta trae URLs firmadas NUEVAS (token distinto) y el navegador volvería a
 * descargar todas las fotos. Si la foto es la misma y su URL sigue vigente, se conserva la anterior.
 */
const conservarFotos = (items: StaffAttendance[]): StaffAttendance[] => {
  const ahora = Date.now();
  return items.map((fila) => {
    if (!fila.img_url) {
      cache.fotos.delete(fila.stff_id);
      return fila;
    }
    const previa = cache.fotos.get(fila.stff_id);
    if (
      previa &&
      ahora - previa.ts < MS_FOTO_VIGENTE &&
      rutaDeFoto(previa.url) === rutaDeFoto(fila.img_url)
    ) {
      return previa.url === fila.img_url ? fila : { ...fila, img_url: previa.url };
    }
    cache.fotos.set(fila.stff_id, { url: fila.img_url, ts: ahora });
    return fila;
  });
};

/** Guarda las filas de una fecha. Si no cambió nada devuelve el MISMO arreglo (React no repinta). */
const guardarAsistenciaEnCache = (
  fecha: string,
  items: StaffAttendance[],
  total: number
): StaffAttendance[] => {
  const previa = cache.asistencia.get(fecha);
  const estable =
    previa && JSON.stringify(previa.items) === JSON.stringify(items) ? previa.items : items;

  cache.asistencia.delete(fecha); // se reinserta al final: el más viejo queda primero
  cache.asistencia.set(fecha, { items: estable, total });
  if (cache.asistencia.size > MAX_FECHAS_EN_CACHE) {
    const masViejo = cache.asistencia.keys().next().value;
    if (masViejo !== undefined) cache.asistencia.delete(masViejo);
  }
  return estable;
};

/** Aplica `transformar` a las filas de TODAS las fechas guardadas en caché. */
const mapearCache = (transformar: (items: StaffAttendance[]) => StaffAttendance[]) => {
  cache.asistencia.forEach((entrada, fecha) => {
    cache.asistencia.set(fecha, { ...entrada, items: transformar(entrada.items) });
  });
};

/* ───────── Hooks de los modales de seccion_4 ───────── */

/** Observación, rol y total de registros de una asistencia (con caché: al reabrir aparece al instante). */
export const useDetalleRegistro = (attId: number) => {
  const [detalle, setDetalle] = useState<RegistroDetalle | null>(
    () => cache.detalles.get(attId) ?? null
  );
  const [cargando, setCargando] = useState(() => !cache.detalles.has(attId));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    getAttendanceDetail(attId)
      .then((nuevo) => {
        if (cancelado) return;
        cache.detalles.set(attId, nuevo);
        setDetalle(nuevo);
        setError("");
      })
      .catch((e) => {
        if (!cancelado) setError(mensajeDe(e, "No se pudo cargar el detalle del registro."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [attId]);

  /** Refleja un cambio ya guardado (ej. la observación) sin volver a pedir nada. */
  const actualizarLocal = useCallback(
    (parche: Partial<RegistroDetalle>) => {
      setDetalle((previo) => {
        if (!previo) return previo;
        const nuevo = { ...previo, ...parche };
        cache.detalles.set(attId, nuevo);
        return nuevo;
      });
    },
    [attId]
  );

  return { detalle, cargando, error, actualizarLocal };
};

/** Incidencias de una asistencia + crear una nueva (con caché). */
export const useIncidencias = (attId: number) => {
  const [lista, setLista] = useState<IncidenciaDescuento[]>(
    () => cache.incidencias.get(attId) ?? []
  );
  const [cargando, setCargando] = useState(() => !cache.incidencias.has(attId));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    getIncidents(attId)
      .then((items) => {
        if (cancelado) return;
        cache.incidencias.set(attId, items);
        setLista(items);
        setError("");
      })
      .catch((e) => {
        if (!cancelado) setError(mensajeDe(e, "No se pudieron cargar las incidencias."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [attId]);

  const crear = useCallback(
    async (descripcion: string, monto: number) => {
      const nueva = await createIncident(attId, descripcion, monto);
      setLista((previa) => {
        const nuevaLista = [nueva, ...previa];
        cache.incidencias.set(attId, nuevaLista);
        return nuevaLista;
      });
    },
    [attId]
  );

  return { lista, cargando, error, crear };
};

/**
 * Cerebro de la página de asistencia. Hace 6 cosas:
 *   1. PROTEGE   la ruta (sin sesión → /login).
 *   2. TRAE      las asistencias de la fecha elegida desde backend-chameleonb2b.
 *   3. ESCUCHA   cambios en la tabla attendance (Realtime) y vuelve a traer.
 *   4. FILTRA    por texto, cargo y estado.
 *   5. RESUME    los números de las 4 tarjetas.
 *   6. REGISTRA  el ingreso de hoy desde el modal "Nuevo registro".
 * Las secciones solo dibujan lo que este hook les entrega.
 */
export const useRegisterController = () => {
  const navigate = useNavigate();
  const { session, loadingAuth } = useAuth();
  const haySesion = Boolean(session);
  usarCacheDe(session?.user?.id ?? null);

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [filtros, setFiltros] = useState<RegisterFilters>(() => ({
    busqueda: "",
    cargo: "",
    estado: "",
    fecha: getFechaLocalHoy(),
  }));

  // Si ya se vio la asistencia de hoy, se arranca con ella (sin pantalla de "Cargando...").
  const [filas, setFilas] = useState<StaffAttendance[]>(
    () => cache.asistencia.get(getFechaLocalHoy())?.items ?? []
  );
  const [totalEmpleados, setTotalEmpleados] = useState(
    () => cache.asistencia.get(getFechaLocalHoy())?.total ?? 0
  );
  const [cargandoDatos, setCargandoDatos] = useState(
    () => !cache.asistencia.has(getFechaLocalHoy())
  );
  const [mensajeError, setMensajeError] = useState("");
  const [resaltados, setResaltados] = useState<Set<number>>(new Set());
  const [cargosCatalogo, setCargosCatalogo] = useState<CustomerJobPosition[]>(
    () => cache.cargos ?? []
  );
  const [rolesCatalogo, setRolesCatalogo] = useState<CustomerRole[]>(() => cache.roles ?? []);

  // Modal "Nuevo registro"
  const [modalAbierto, setModalAbierto] = useState(false);
  const [personalPendiente, setPersonalPendiente] = useState<StaffPendiente[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState("");
  const [filtroModal, setFiltroModal] = useState(""); // "" | "cargo:<id>" | "rol:<id>"
  const [seleccionado, setSeleccionado] = useState<StaffPendiente | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [exitoModal, setExitoModal] = useState("");
  const [recargaModal, setRecargaModal] = useState(0); // al cambiar, se vuelve a pedir la lista
  const [modoModal, setModoModal] = useState<ModoRegistro>("ingreso");
  const [descripcionAusencia, setDescripcionAusencia] = useState("");
  // Si dos cargas se solapan (cambio rápido de fecha, eventos Realtime) solo cuenta la última.
  const numeroUltimaPeticion = useRef(0);
  // Huella de cada fila en la carga anterior: así se sabe cuáles cambiaron.
  const firmasPrevias = useRef<Map<number, string>>(new Map());
  const temporizadorResaltado = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hoy = getFechaLocalHoy();

  const actualizarFiltro: ActualizarFiltro = useCallback((clave, valor) => {
    setFiltros((previos) => ({ ...previos, [clave]: valor }));
  }, []);

  // ─── 1. PROTEGER la ruta ───────────────────────────────────────────────────
  useEffect(() => {
    if (!loadingAuth && !session) {
      localStorage.clear();
      navigate("/login");
    }
  }, [loadingAuth, session, navigate]);

  // ─── 2. TRAER asistencias ──────────────────────────────────────────────────
  const cargarAsistencia = useCallback(
    async (fecha: string, mostrarCargando: boolean) => {
      const numeroDePeticion = ++numeroUltimaPeticion.current;
      if (mostrarCargando) setCargandoDatos(true);

      try {
        const respuesta = await getAttendanceByDate(fecha);
        if (numeroDePeticion !== numeroUltimaPeticion.current) return;

        // Filas nuevas o con horas distintas a la carga anterior → se resaltan unos segundos.
        const previas = firmasPrevias.current;
        const cambiadas = new Set<number>();
        if (previas.size > 0) {
          respuesta.items.forEach((fila) => {
            if (previas.get(fila.att_id) !== firmaRegistro(fila)) cambiadas.add(fila.att_id);
          });
        }
        firmasPrevias.current = new Map(respuesta.items.map((f) => [f.att_id, firmaRegistro(f)]));

        if (cambiadas.size > 0) {
          setResaltados(cambiadas);
          if (temporizadorResaltado.current) clearTimeout(temporizadorResaltado.current);
          temporizadorResaltado.current = setTimeout(
            () => setResaltados(new Set()),
            SEGUNDOS_RESALTADO * 1000
          );
        }

        const items = guardarAsistenciaEnCache(
          fecha,
          conservarFotos(respuesta.items),
          respuesta.total_staff
        );
        setFilas(items);
        setTotalEmpleados(respuesta.total_staff);
        setMensajeError("");
      } catch (error) {
        if (numeroDePeticion !== numeroUltimaPeticion.current) return;
        console.error("Error al cargar asistencias:", error);
        setMensajeError(mensajeDe(error, "No se pudo cargar la asistencia."));
      } finally {
        if (numeroDePeticion === numeroUltimaPeticion.current) setCargandoDatos(false);
      }
    },
    []
  );

  // ─── 2 + 3. Carga al entrar / cambiar de fecha + suscripción Realtime ──────
  useEffect(() => {
    if (!haySesion) return;

    // Si esta fecha ya está en caché se muestra al instante y se refresca en silencio;
    // las filas que hayan cambiado mientras no se miraba se resaltan unos segundos.
    const guardada = cache.asistencia.get(filtros.fecha);
    firmasPrevias.current = new Map(
      (guardada?.items ?? []).map((fila) => [fila.att_id, firmaRegistro(fila)])
    );
    if (guardada) {
      setFilas(guardada.items);
      setTotalEmpleados(guardada.total);
      setCargandoDatos(false);
    }
    void cargarAsistencia(filtros.fecha, !guardada);

    const canal = supabase
      .channel("attendance-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        void cargarAsistencia(filtros.fecha, false); // sin parpadeo de "Cargando..."
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [haySesion, filtros.fecha, cargarAsistencia]);

  // Limpia el temporizador del resaltado al salir de la página.
  useEffect(
    () => () => {
      if (temporizadorResaltado.current) clearTimeout(temporizadorResaltado.current);
    },
    []
  );

  // Cargos y roles (filtro de la tabla y del modal). Si fallan se usan los cargos de las filas.
  useEffect(() => {
    if (!haySesion) return;
    let cancelado = false;

    getCustomerJobPositions()
      .then((cargos) => {
        cache.cargos = cargos;
        if (!cancelado) setCargosCatalogo(cargos);
      })
      .catch((error) => console.warn("No se pudo cargar el catálogo de cargos:", error));

    getCustomerRoles()
      .then((roles) => {
        cache.roles = roles;
        if (!cancelado) setRolesCatalogo(roles);
      })
      .catch((error) => console.warn("No se pudo cargar el catálogo de roles:", error));

    return () => {
      cancelado = true;
    };
  }, [haySesion]);

  // ─── 4. FILTRAR ────────────────────────────────────────────────────────────
  const filasFiltradas = useMemo(() => {
    const texto = normalizarTexto(filtros.busqueda);

    return filas.filter((fila) => {
      if (texto !== "") {
        const campos = normalizarTexto(`${fila.stff_name} ${fila.stff_lastname} ${fila.stff_dni}`);
        if (!campos.includes(texto)) return false;
      }

      if (filtros.cargo !== "" && fila.job_position_name !== filtros.cargo) return false;

      const estado = getEstado(fila);
      if (filtros.estado === "presente" && estado !== "puntual") return false;
      if (filtros.estado === "tardanza" && estado !== "tardanza") return false;
      if (filtros.estado === "ausente" && estado !== null) return false; // sin ingreso registrado

      return true;
    });
  }, [filas, filtros.busqueda, filtros.cargo, filtros.estado]);

  const cargosDisponibles = useMemo(() => {
    const nombres =
      cargosCatalogo.length > 0
        ? cargosCatalogo.map((cargo) => cargo.name)
        : filas.map((fila) => fila.job_position_name).filter((n): n is string => !!n);
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, "es"));
  }, [cargosCatalogo, filas]);

  // ─── 5. RESUMEN (siempre sobre todas las filas de la fecha, sin filtros) ───
  const resumen: RegisterSummary = useMemo(() => {
    let presentes = 0;
    let tardanzas = 0;

    for (const fila of filas) {
      const estado = getEstado(fila);
      if (estado === "puntual") presentes++;
      else if (estado === "tardanza") tardanzas++;
    }

    return {
      totalEmpleados,
      presentes,
      tardanzas,
      // Personal activo que todavía no registró ingreso (tenga o no fila ese día).
      ausencias: Math.max(0, totalEmpleados - presentes - tardanzas),
    };
  }, [filas, totalEmpleados]);

  const hayFiltrosActivos =
    filtros.busqueda.trim() !== "" || filtros.cargo !== "" || filtros.estado !== "";

  // ─── 6. REGISTRAR ingreso desde el modal "Nuevo registro" ──────────────────
  const abrirModal = useCallback((modo: ModoRegistro) => {
    setModoModal(modo);
    setDescripcionAusencia("");
    setBusquedaModal("");
    setFiltroModal("");
    setSeleccionado(null);
    setErrorModal("");
    setExitoModal("");
    setCargandoPendientes(true);
    setModalAbierto(true);
  }, []);

  const abrirIngreso = useCallback(() => abrirModal("ingreso"), [abrirModal]);
  const abrirAusencia = useCallback(() => abrirModal("ausencia"), [abrirModal]);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setSeleccionado(null);
    setDescripcionAusencia("");
  }, []);

  // Trae el personal activo sin ingreso hoy. Espera un momento al escribir para no pedir en cada letra.
  useEffect(() => {
    if (!modalAbierto || !haySesion) return;

    let cancelado = false;
    const [tipo, idTexto] = filtroModal.split(":");
    const id = Number(idTexto);
    const obtenerPendientes = modoModal === "ausencia" ? getPendingAbsence : getPendingCheckIn;
    const temporizador = setTimeout(
      async () => {
        setCargandoPendientes(true);
        try {
          const personal = await obtenerPendientes({
            search: busquedaModal.trim(),
            cargoId: tipo === "cargo" ? id : null,
            rolId: tipo === "rol" ? id : null,
          });
          if (cancelado) return;
          setPersonalPendiente(personal);
          setErrorModal("");
        } catch (error) {
          if (cancelado) return;
          console.error("Error al cargar el personal pendiente:", error);
          setErrorModal(mensajeDe(error, "No se pudo cargar el personal."));
        } finally {
          if (!cancelado) setCargandoPendientes(false);
        }
      },
      busquedaModal === "" ? 0 : MS_ESPERA_BUSQUEDA
    );

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
}, [modalAbierto, haySesion, modoModal, busquedaModal, filtroModal, recargaModal]);

  const seleccionarPersonal = useCallback((staff: StaffPendiente) => {
    setErrorModal("");
    setExitoModal("");
    setDescripcionAusencia("");
    setSeleccionado(staff);
  }, []);

  const cancelarSeleccion = useCallback(() => {
    setSeleccionado(null);
    setDescripcionAusencia("");
  }, []);

  const confirmarRegistro = useCallback(async () => {
    if (!seleccionado || registrando) return;
    const staff = seleccionado;
    const esAusencia = modoModal === "ausencia";
    const descripcion = descripcionAusencia.trim();

    // La ausencia exige descripción (el backend también lo valida).
    if (esAusencia && (descripcion === "" || descripcion.length > MAX_DESCRIPCION_AUSENCIA)) return;

    setRegistrando(true);
    setErrorModal("");
    try {
      if (esAusencia) await registerAbsence(staff.stff_id, descripcion);
      else await registerCheckIn(staff.stff_id);

      // Ya registrado: sale de la lista del modal y se vuelve a traer la tabla
      // (además de Realtime, por si la tabla no emite eventos para este usuario).
      setPersonalPendiente((previos) => previos.filter((p) => p.stff_id !== staff.stff_id));
      void cargarAsistencia(filtros.fecha, false);
      setExitoModal(
        esAusencia
          ? `Ausencia de ${staff.stff_name} ${staff.stff_lastname} registrada.`
          : `Ingreso de ${staff.stff_name} ${staff.stff_lastname} registrado.`
      );
    } catch (error) {
      console.error("Error al registrar:", error);
      setErrorModal(
        mensajeDe(error, esAusencia ? "No se pudo registrar la ausencia." : "No se pudo registrar la asistencia.")
      );
      setRecargaModal((n) => n + 1); // por si otro equipo ya lo registró: se refresca la lista
    } finally {
      setSeleccionado(null);
      setDescripcionAusencia("");
      setRegistrando(false);
    }
  }, [seleccionado, registrando, modoModal, descripcionAusencia, cargarAsistencia, filtros.fecha]);

  // ─── Acciones de los modales de seccion_4 ──────────────────────────────────
  /** Refleja en la tabla (y en la caché) un cambio ya guardado en el backend. */
  const actualizarFila = useCallback((attId: number, parche: Partial<StaffAttendance>) => {
    const aplicar = (items: StaffAttendance[]) =>
      items.map((fila) => (fila.att_id === attId ? { ...fila, ...parche } : fila));
    mapearCache(aplicar);
    setFilas(aplicar);
  }, []);

  /** Quita la fila al instante; si el backend falla, vuelve a traer la tabla y lanza el error. */
  const eliminarRegistro = useCallback(
    async (attId: number) => {
      const quitar = (items: StaffAttendance[]) => items.filter((fila) => fila.att_id !== attId);
      mapearCache(quitar);
      cache.detalles.delete(attId);
      cache.incidencias.delete(attId);
      firmasPrevias.current.delete(attId);
      setFilas(quitar);

      try {
        await deleteAttendance(attId);
      } catch (error) {
        void cargarAsistencia(filtros.fecha, false); // la fila vuelve a aparecer
        throw error;
      }
    },
    [cargarAsistencia, filtros.fecha]
  );

  const nuevoRegistro: NuevoRegistroControl = {
    abierto: modalAbierto,
        abrir: abrirIngreso,
    abrirAusencia,
    modo: modoModal,
    descripcion: descripcionAusencia,
    onCambiarDescripcion: setDescripcionAusencia,
    maxDescripcion: MAX_DESCRIPCION_AUSENCIA,
    cerrar: cerrarModal,

    personal: personalPendiente,
    cargando: cargandoPendientes,

    busqueda: busquedaModal,
    onCambiarBusqueda: setBusquedaModal,
    filtro: filtroModal,
    onCambiarFiltro: setFiltroModal,
    cargos: cargosCatalogo,
    roles: rolesCatalogo,

    seleccionado,
    onSeleccionar: seleccionarPersonal,
    onCancelarSeleccion: cancelarSeleccion,
    onConfirmar: () => void confirmarRegistro(),
    registrando,

    error: errorModal,
    exito: exitoModal,
  };

  return {
    filtros,
    actualizarFiltro,
    hoy,
    esHoy: filtros.fecha === hoy,
    cargosDisponibles,

    filas: filasFiltradas,
    resumen,
    resaltados,
    hayFiltrosActivos,
    /** Cambia cuando cambian fecha o filtros: la tabla vuelve a la página 1. */
    llaveFiltros: `${filtros.fecha}|${filtros.busqueda}|${filtros.cargo}|${filtros.estado}`,

    cargando: loadingAuth || cargandoDatos,
    mensajeError,

    actualizarFila,
    eliminarRegistro,

    nuevoRegistro,
  };
};