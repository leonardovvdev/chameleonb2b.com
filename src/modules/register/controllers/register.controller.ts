import { supabase } from "../../../lib/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";import type {
  ActualizarFiltro,
  ActualizarFila,
  Incidencia,
  ListasResumen,
  NuevoRegistroControl,
  PersonaResumen,
  RegisterFilters,
  RegisterSummary,
  RegistroDetalle,
  StaffAttendance,
  StaffPendiente,
} from "../types/register.types";
import {
  createIncidencia,
  crearAsistencia,
  eliminarAsistencia,
  getAsistenciasPorFecha,
  getAttendanceDetail,
  getCargos,
  getIncidencias,
  getPersonalActivo,
  getPersonalElegible,
  getRoles,
  deleteIncidencia,
  getPuedeEliminar,
} from "../services/register.service";
import type { CatalogoItem } from "../services/register.service";

/* ───────── Reglas (ya no vienen de data.ts) ───────── */
/** Cada cuánto se vuelve a pedir la lista de hoy (los registros también llegan desde la app móvil). */
/** Respaldo por si se cae la conexión en vivo (lo normal es que Realtime avise al instante). */
const INTERVALO_REFRESCO_MS = 60_000;/** Las fotos son URLs firmadas que duran 1 h: se reutilizan para que no parpadeen y se renuevan antes de vencer. */
const RENOVAR_FOTOS_MS = 30 * 60_000;
const HORA_INGRESO = "08:00";
const TOLERANCIA_MINUTOS = 5;
/** Duración máxima del refrigerio (min). Pasada esta duración + tolerancia = tardanza de refrigerio. */
const RECESO_MAXIMO_MINUTOS = 60;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* ═══════════ Utilidades (fechas, horas, estado) ═══════════ */

const pad = (n: number): string => String(n).padStart(2, "0");

export const getFechaLocalHoy = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "2026-11-03" → "Hoy, 3 Nov 2026" o "3 Nov 2026". */
export const textoFecha = (fecha: string, esHoy: boolean): string => {
  const [y, m, d] = fecha.split("-").map(Number);
  const texto = `${d} ${MESES[m - 1] ?? ""} ${y}`;
  return esHoy ? `Hoy, ${texto}` : texto;
};

/** Timestamp ISO → minutos desde medianoche (hora local), o null. */
export const aMinutos = (valor: string | null): number | null => {
  if (!valor) return null;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
};

/** Timestamp ISO → "HH:MM" (hora local), o "" si no hay valor. */
export const formatHora = (valor: string | null): string => {
  const min = aMinutos(valor);
  return min === null ? "" : `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
};

/** Fecha (YYYY-MM-DD) + hora (HH:MM) locales → timestamp ISO. */
export const aIsoLocal = (fecha: string, hhmm: string): string =>
  new Date(`${fecha}T${hhmm}:00`).toISOString();

export const formatDuracion = (minutos: number): string =>
  minutos < 60 ? `${minutos}m` : `${Math.floor(minutos / 60)}h ${pad(minutos % 60)}m`;

const diferencia = (desde: string | null, hasta: string | null): number | null => {
  if (!desde || !hasta) return null;
  const min = Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 60000);
  return min >= 0 ? min : null;
};

/** Total R: minutos de receso. */
export const minutosReceso = (a: StaffAttendance): number | null =>
  diferencia(a.att_refreshment_start, a.att_refreshment_end);

/** Total L: minutos laborados (jornada menos receso). */
export const minutosLaborados = (a: StaffAttendance): number | null => {
  const total = diferencia(a.att_schedule_start, a.att_schedule_end);
  if (total === null) return null;
  return Math.max(0, total - (minutosReceso(a) ?? 0));
};

const hhmmAMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const getEstado = (a: StaffAttendance): "puntual" | "tardanza" | "ausente" => {
  const ingreso = aMinutos(a.att_schedule_start);
  if (ingreso === null) return "ausente"; // sin hora de ingreso
  return ingreso > hhmmAMinutos(HORA_INGRESO) + TOLERANCIA_MINUTOS ? "tardanza" : "puntual";
};

// Una sola regla para la tabla, el filtro "Ausente" y la card de Ausencias.
const esAusente = (a: StaffAttendance): boolean => getEstado(a) === "ausente";

/** Tardanza de refrigerio: el receso terminó y duró más de lo permitido. */
const esTardanzaRefrigerio = (a: StaffAttendance): boolean => {
  const min = minutosReceso(a);
  return min !== null && min > RECESO_MAXIMO_MINUTOS + TOLERANCIA_MINUTOS;
};

const aPersona = (p: {
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  img_url: string | null;
}): PersonaResumen => ({
  stff_id: p.stff_id,
  stff_name: p.stff_name,
  stff_lastname: p.stff_lastname,
  img_url: p.img_url,
});
const aPersonaJustificada = (
  a: StaffAttendance,
  justificacion: string | null
): PersonaResumen => ({
  ...aPersona(a),
  justificacion: justificacion?.trim() ? justificacion : null,
});
/** Columna "Incidencias": total de incidencias (staff_discount_incidents) de este registro. */
export const getIncidentes = (a: StaffAttendance): number => a.incidents_count ?? 0;

const normalizar = (t: string): string =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/* ═══════════ Hooks de los modales ═══════════ */

export const useDetalleRegistro = (attId: number) => {
  const [detalle, setDetalle] = useState<RegistroDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    getAttendanceDetail(attId)
      .then((d) => {
        if (cancelado) return;
        setDetalle(d);
        setError("");
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudo cargar el detalle.");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [attId]);

  const actualizarLocal = useCallback((parche: Partial<RegistroDetalle>) => {
    setDetalle((previo) => (previo ? { ...previo, ...parche } : previo));
  }, []);

  return { detalle, cargando, error, actualizarLocal };
};

export const usePuedeEliminar = () => {
  const [puede, setPuede] = useState(false);

  useEffect(() => {
    let cancelado = false;
    getPuedeEliminar()
      .then((v) => {
        if (!cancelado) setPuede(v);
      })
      .catch(() => {
        if (!cancelado) setPuede(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return puede;
};

export const useIncidencias = (attId: number) => {
  const [lista, setLista] = useState<Incidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    getIncidencias(attId)
      .then((l) => {
        if (cancelado) return;
        setLista(l);
        setError("");
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : "No se pudieron cargar las incidencias.");
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
      const nueva = await createIncidencia(attId, descripcion, monto);
      setLista((previa) => [nueva, ...previa]);
    },
    [attId]
  );

  /** Devuelve cuántas incidencias quedan en el registro. */
  const eliminar = useCallback(async (id: number) => {
    const r = await deleteIncidencia(id);
    setLista((previa) => previa.filter((i) => i.id !== id));
    return r.total;
  }, []);

  return { lista, cargando, error, crear, eliminar };
};

/* ═══════════ Controller de la página ═══════════ */

const mensajeDe = (e: unknown, porDefecto: string): string => (e instanceof Error ? e.message : porDefecto);

export const useRegisterController = () => {
  const hoy = getFechaLocalHoy();

  const [filtros, setFiltros] = useState<RegisterFilters>({
    busqueda: "",
    cargo: "",
    estado: "",
    fecha: hoy,
  });

  /* ───────── Datos reales ───────── */
  const [todas, setTodas] = useState<StaffAttendance[]>([]);
  const [staff, setStaff] = useState<StaffPendiente[]>([]);
  const [cargosCatalogo, setCargosCatalogo] = useState<CatalogoItem[]>([]);
  const [rolesCatalogo, setRolesCatalogo] = useState<CatalogoItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  // Catálogos y personal activo: una vez al montar.
  useEffect(() => {
    let cancelado = false;
    Promise.all([getPersonalActivo(), getCargos(), getRoles()])
      .then(([personal, cargos, roles]) => {
        if (cancelado) return;
        setStaff(personal);
        setCargosCatalogo(cargos);
        setRolesCatalogo(roles);
      })
      .catch((e) => {
        if (!cancelado) setMensajeError(mensajeDe(e, "No se pudo cargar el personal."));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Asistencias: se vuelven a pedir cada vez que cambia la fecha del filtro.
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    getAsistenciasPorFecha(filtros.fecha)
      .then((lista) => {
        if (cancelado) return;
        setTodas(lista);
        setMensajeError("");
      })
      .catch((e) => {
        if (cancelado) return;
        setTodas([]);
        setMensajeError(mensajeDe(e, "No se pudieron cargar los registros."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [filtros.fecha]);
  // Actualización automática: solo mientras se ve el día de hoy y la pestaña está visible.
  // No muestra "cargando" y, si falla una consulta, se reintenta en el siguiente ciclo.
  const ultimaRenovacionFotos = useRef(Date.now());
  useEffect(() => {
    if (filtros.fecha !== hoy) return;

    let cancelado = false;
    const refrescar = () => {
      if (document.hidden) return;
      getAsistenciasPorFecha(hoy)
        .then((lista) => {
          if (cancelado) return;
          const renovar = Date.now() - ultimaRenovacionFotos.current > RENOVAR_FOTOS_MS;
          if (renovar) ultimaRenovacionFotos.current = Date.now();
          setTodas((previas) => {
            if (renovar) return lista;
            const fotos = new Map(previas.map((a) => [a.stff_id, a.img_url]));
            return lista.map((a) => ({ ...a, img_url: fotos.get(a.stff_id) ?? a.img_url }));
          });
        })
        .catch(() => {});
    };

    // Aviso instantáneo de la base de datos. Se espera un poco porque un registro crea
    // varias filas a la vez y llegan varios avisos seguidos.
    let espera: number | undefined;
    const programarRefresco = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(refrescar, 600);
    };
    const canal = supabase
      .channel("attendance-cambios")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, programarRefresco)
      .subscribe();

    const temporizador = window.setInterval(refrescar, INTERVALO_REFRESCO_MS);
    document.addEventListener("visibilitychange", refrescar); // al volver a la pestaña, actualiza al instante
    return () => {
      cancelado = true;
      window.clearTimeout(espera);
      window.clearInterval(temporizador);
      document.removeEventListener("visibilitychange", refrescar);
      void supabase.removeChannel(canal);
    };
  }, [filtros.fecha, hoy]);
  const [resaltados, setResaltados] = useState<Set<number>>(new Set());

  const resaltar = (id: number) => {
    setResaltados((p) => new Set(p).add(id));
    window.setTimeout(() => {
      setResaltados((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
    }, 4000);
  };

  const esHoy = filtros.fecha === hoy;

  const actualizarFiltro: ActualizarFiltro = (clave, valor) =>
    setFiltros((previos) => ({ ...previos, [clave]: valor }));

  /* ───────── Filas, resumen y filtros ───────── */
  // `todas` ya trae solo la fecha elegida (la filtra el servidor).
  const delDia = todas;

  const resumen: RegisterSummary = useMemo(
    () => ({
      totalEmpleados: staff.length,
      puntuales: delDia.filter((a) => getEstado(a) === "puntual").length,
      tardanzas: delDia.filter((a) => getEstado(a) === "tardanza").length,
      ausencias: delDia.filter(esAusente).length,
    }),
    [delDia, staff]
  );

  /* Listas que muestra el modal de cada card de Seccion_2. */
  const listas: ListasResumen = useMemo(() => {
    const marcaron = new Set(
      delDia.filter((a) => a.att_schedule_start).map((a) => a.stff_id)
    );
    return {
      empleados: staff.map(aPersona),
      puntuales: delDia.filter((a) => getEstado(a) === "puntual").map(aPersona),
      tardanzaIngreso: delDia
        .filter((a) => getEstado(a) === "tardanza")
        .map((a) => aPersonaJustificada(a, a.att_justification_delay)),
      tardanzaRefrigerio: delDia
        .filter(esTardanzaRefrigerio)
        .map((a) => aPersonaJustificada(a, a.att_justification_refreshment_delay)),
      ausentes: staff.filter((s) => !marcaron.has(s.stff_id)).map(aPersona),
    };
  }, [delDia, staff]);

  const filas = useMemo(() => {
    const q = normalizar(filtros.busqueda);
    return delDia.filter((a) => {
      if (q) {
        const texto = normalizar(`${a.stff_name} ${a.stff_lastname} ${a.stff_dni}`);
        if (!texto.includes(q)) return false;
      }
      if (filtros.cargo && a.job_position_name !== filtros.cargo) return false;
      if (filtros.estado === "presente" && getEstado(a) !== "puntual") return false;
      if (filtros.estado === "tardanza" && getEstado(a) !== "tardanza") return false;
      if (filtros.estado === "ausente" && !esAusente(a)) return false;
      return true;
    });
  }, [delDia, filtros]);

  // Cargos del desplegable (Seccion_3 filtra por nombre).
  const cargosDisponibles = useMemo(
    () => cargosCatalogo.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [cargosCatalogo]
  );

  const llaveFiltros = `${filtros.fecha}|${filtros.busqueda}|${filtros.cargo}|${filtros.estado}`;
  const hayFiltrosActivos =
    filtros.busqueda.trim() !== "" || filtros.cargo !== "" || filtros.estado !== "";

  /* ───────── Cambios sobre filas (Seccion_4: solo se adaptó a estado local) ───────── */
  const actualizarFila: ActualizarFila = useCallback((attId, parche) => {
    setTodas((previas) => previas.map((a) => (a.att_id === attId ? { ...a, ...parche } : a)));
  }, []);

  const eliminarRegistro = useCallback(async (attId: number) => {
    await eliminarAsistencia(attId); // si falla, lanza el error y la fila NO se quita de la tabla
    setTodas((previas) => previas.filter((a) => a.att_id !== attId));
  }, []);

  /* ───────── Nuevo registro / ausencia ───────── */
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [seleccionado, setSeleccionado] = useState<StaffPendiente | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  // Quiénes ya tienen registro HOY (se consulta al abrir el modal; no depende de la fecha del filtro).
  const [conRegistroHoy, setConRegistroHoy] = useState<Set<number>>(new Set());
// Personal activo CON contrato vigente en la fecha elegida (es lo que muestra el modal de registrar).
const [elegibles, setElegibles] = useState<StaffPendiente[]>([]);
const [cargandoPendientes, setCargandoPendientes] = useState(false);
// Solo se usa cuando la fecha elegida NO es hoy (en hoy la hora la pone el servidor).
const [horaIngreso, setHoraIngreso] = useState(HORA_INGRESO);

const reiniciar = () => {
  setBusqueda("");
  setFiltro("");
  setSeleccionado(null);
  setError("");
  setExito("");
  setHoraIngreso(HORA_INGRESO);
};

const cargarPendientes = async (fecha: string) => {
  setCargandoPendientes(true);
  try {
    const [registrosDelDia, personal] = await Promise.all([
      getAsistenciasPorFecha(fecha),
      getPersonalElegible(fecha),
    ]);
    // Ahora es "con registro en la fecha elegida" (el nombre del estado se quedó por no tocar más código).
    setConRegistroHoy(
      new Set(
        registrosDelDia
            .filter((a) => a.att_schedule_start || a.att_justification_absence !== null)
            .map((a) => a.stff_id)
        )
      );
      setElegibles(personal);
    } catch (e) {
      setError(mensajeDe(e, "No se pudo cargar el personal pendiente."));
    } finally {
      setCargandoPendientes(false);
    }
  };

  const abrir = () => {
    reiniciar();
    setAbierto(true);
    void cargarPendientes(filtros.fecha);
  };

  const cerrar = useCallback(() => {
    setAbierto(false);
    setBusqueda("");
    setFiltro("");
    setSeleccionado(null);
    setError("");
    setExito("");
    setHoraIngreso(HORA_INGRESO);
}, []);

  const onCancelarSeleccion = useCallback(() => {
    setSeleccionado(null);
    setError("");
  }, []);

  // Pendientes: personal activo sin registro en el día de hoy.
  const personal = useMemo(() => {
    const q = normalizar(busqueda);
    const [tipo, idTexto] = filtro.split(":");
    const idFiltro = Number(idTexto);

    return elegibles.filter((s) => {
      if (conRegistroHoy.has(s.stff_id)) return false;
      if (q && !normalizar(`${s.stff_name} ${s.stff_lastname} ${s.stff_dni}`).includes(q)) return false;
      if (tipo === "cargo" && s.job_position_id !== idFiltro) return false;
      if (tipo === "rol" && s.role_id !== idFiltro) return false;
      return true;
    });
  }, [elegibles, conRegistroHoy, busqueda, filtro]);

const confirmar = async () => {
  if (!seleccionado || registrando) return;

  // La fecha sale del calendario, no de "hoy".
  const fecha = filtros.fecha;
  if (!esHoy && !/^\d{2}:\d{2}$/.test(horaIngreso)) {
    setError("Indica la hora de ingreso.");
    return;
  }

  setRegistrando(true);
  setError("");
  try {
    const fila = await crearAsistencia({
      staffId: seleccionado.stff_id,
      date: fecha,
      // Hoy: la hora la pone el servidor. Otra fecha: la hora indicada en el modal.
      startAt: esHoy ? undefined : aIsoLocal(fecha, horaIngreso),
    });

    setConRegistroHoy((previo) => new Set(previo).add(fila.stff_id));
    // El backend también creó las filas vacías del resto del personal: se vuelve a pedir la lista de esa fecha.
    const lista = await getAsistenciasPorFecha(fecha).catch(() => [fila]);
    setTodas(lista);
    resaltar(fila.att_id);
    // Ya no se fuerza fecha: hoy; se queda en la fecha del calendario.

      const nombre = `${seleccionado.stff_name} ${seleccionado.stff_lastname}`;
      setExito(`Asistencia de ${nombre} registrada.`);
      setSeleccionado(null);
    } catch (e) {
      setError(mensajeDe(e, "No se pudo registrar."));
    } finally {
      setRegistrando(false);
    }
  };

  const nuevoRegistro: NuevoRegistroControl = {
    abierto,
    abrir,
    cerrar,
    fecha: filtros.fecha,
    esHoy,
    horaIngreso,
    onCambiarHoraIngreso: setHoraIngreso,
    personal,
    cargando: cargandoPendientes,
    busqueda,
    onCambiarBusqueda: setBusqueda,
    filtro,
    onCambiarFiltro: setFiltro,
    cargos: cargosCatalogo,
    roles: rolesCatalogo,
    seleccionado,
    onSeleccionar: (s) => {
      setSeleccionado(s);
      setError("");
      setExito("");
    },
    onCancelarSeleccion,
    onConfirmar: () => void confirmar(),
    registrando,
    error,
    exito,
  };

  return {
    filtros,
    actualizarFiltro,
    hoy,
    esHoy,
    cargando,
    mensajeError,
    resumen,
    listas,
    filas,
    cargosDisponibles,
    resaltados,
    llaveFiltros,
    hayFiltrosActivos,
    actualizarFila,
    eliminarRegistro,
    nuevoRegistro,
  };
};