import { useState, useLayoutEffect, useCallback, useRef } from "react";
import style from "./seccion_4.module.css";
import ModalRegistro, { type PestanaRegistro } from "./shared/modal/modal_registro";
import ModalTresPuntos, { ConfirmarEliminar } from "./shared/modal/modal_tres_puntos";
import type { ActualizarFila, StaffAttendance } from "../../types/register.types";
import {
  formatDuracion,
  formatHora,
  getEstado,
  getIncidentes,
  minutosLaborados,
  minutosReceso,
} from "../../controllers/register.controller";
import { icon } from "../../../../core/icons";

const ALTO_FILA = 65; // 40px foto + 12px*2 padding + 1px borde (igual que el CSS)
const ALTO_HEADER = 48; // fallback si no se puede medir el <thead>

const BADGE_ESTADO = {
  puntual: { clase: style.badgePuntual, texto: "Puntual" },
  tardanza: { clase: style.badgeTardanza, texto: "Tardanza" },
  ausente: { clase: style.badgeAusente, texto: "Ausente" },
} as const;

const iniciales = (nombre?: string, apellido?: string) =>
  `${nombre?.trim()[0] ?? ""}${apellido?.trim()[0] ?? ""}`.toUpperCase();

/** Devuelve los números de página a mostrar, con "…" para los saltos. */
const paginasVisibles = (actual: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, n) => n + 1);

  const paginas: (number | "…")[] = [1];
  const desde = Math.max(2, actual - 1);
  const hasta = Math.min(total - 1, actual + 1);

  if (desde > 2) paginas.push("…");
  for (let n = desde; n <= hasta; n++) paginas.push(n);
  if (hasta < total - 1) paginas.push("…");
  paginas.push(total);

  return paginas;
};

const IconoPuntos = () => (
  <svg
    className={style.iconoPuntos}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const IconoFlecha = ({ derecha = false }: { derecha?: boolean }) => (
  <svg
    className={style.iconoFlecha}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={derecha ? { transform: "rotate(180deg)" } : undefined}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const Hora = ({
  valor,
  icono,
}: {
  valor: string | null;
  icono: "reloj" | "cafe";
}) => {
  const texto = formatHora(valor);
  if (!texto) return null;
  return (
    <span className={style.hora}>
      {icono === "reloj" ? (
        <icon.iconClock className={style.icon} />
      ) : (
        <icon.iconCoffee className={style.icon} />
      )}
      {texto}
    </span>
  );
};

interface Seccion4Props {
  /** Filas ya filtradas por el controller. */
  filas: StaffAttendance[];
  cargando: boolean;
  mensajeError: string;
  /** Ids de las filas que cambiaron hace poco (se resaltan unos segundos). */
  resaltados: Set<number>;
  /** Cambia cuando cambian fecha o filtros: la tabla vuelve a la página 1. */
  llaveFiltros: string;
  hayFiltrosActivos: boolean;
  esHoy: boolean;
  /** Refleja en la tabla un cambio ya guardado desde los modales. */
  onActualizarFila: ActualizarFila;
  /** Elimina el registro (lanza error si el backend falla). */
  onEliminarRegistro: (attId: number) => Promise<void>;
}

const Seccion_4 = ({
  filas,
  cargando,
  mensajeError,
  resaltados,
  llaveFiltros,
  hayFiltrosActivos,
  esHoy,
  onActualizarFila,
  onEliminarRegistro,
}: Seccion4Props) => {
  // Modal con las 5 pestañas (fila + pestaña con la que se abre).
  const [registroAbierto, setRegistroAbierto] = useState<{
    fila: StaffAttendance;
    pestana: PestanaRegistro;
  } | null>(null);
  // Menú de los 3 puntos (fila + posición del botón).
  const [menu, setMenu] = useState<{ fila: StaffAttendance; ancla: DOMRect } | null>(null);
  // Fila que se está por eliminar (muestra la confirmación).
  const [porEliminar, setPorEliminar] = useState<StaffAttendance | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const seccionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hayRegistros = filas.length > 0;

  // El modal muestra siempre la versión más reciente de la fila (si ya no está en la tabla, la última que se vio).
  const registroVivo = registroAbierto
    ? (filas.find((f) => f.att_id === registroAbierto.fila.att_id) ?? registroAbierto.fila)
    : null;

  // Al cambiar fecha o filtros se vuelve a la página 1 (ajuste durante el render).
  const [llavePrevia, setLlavePrevia] = useState(llaveFiltros);
  if (llavePrevia !== llaveFiltros) {
    setLlavePrevia(llaveFiltros);
    setPagina(1);
  }

  // Ajusta la sección al alto de la ventana (20px abajo por el padding-bottom)
  // y calcula cuántas filas caben sin hacer scroll vertical.
  const recalcular = useCallback(() => {
    const sec = seccionRef.current;
    if (!sec) return;

    const top = sec.getBoundingClientRect().top;
    sec.style.height = `${Math.max(300, window.innerHeight - top)}px`;

    const scroll = scrollRef.current;
    if (!scroll) return;

    const headH =
      scroll.querySelector("thead")?.getBoundingClientRect().height ?? ALTO_HEADER;
    const filasQueCaben = Math.floor((scroll.clientHeight - headH - 1) / ALTO_FILA);
    setPorPagina(Math.max(1, filasQueCaben));
  }, []);

  // IMPORTANTE: este hook va ANTES del return condicional de abajo.
  // No agregues hooks debajo del `if (cargando)`.
  useLayoutEffect(() => {
    recalcular();
    window.addEventListener("resize", recalcular);
    return () => window.removeEventListener("resize", recalcular);
  }, [recalcular, cargando, hayRegistros, errorEliminar]);

  if (cargando) {
    return (
      <div className={style.seccion} ref={seccionRef}>
        <div className={style.tarjeta}>
          <p className={style.mensaje}>Cargando asistencia...</p>
        </div>
      </div>
    );
  }

  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const visibles = filas.slice(inicio, inicio + porPagina);

  // Sin filas: se muestra el error real, o el motivo de que no haya nada.
  const mensajeVacio = mensajeError
    ? mensajeError
    : hayFiltrosActivos
      ? "No se encontraron resultados con los filtros aplicados."
      : `No hay registros de asistencia para ${esHoy ? "el día de hoy" : "esta fecha"}.`;

  return (
    <div className={style.seccion} ref={seccionRef}>
      <div className={style.tarjeta}>
        {errorEliminar && (
          <div role="alert" className={style.avisoError}>
            <span>{errorEliminar}</span>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => setErrorEliminar("")}
              className={style.avisoErrorCerrar}
            >
              ×
            </button>
          </div>
        )}

        {!hayRegistros ? (
          <p className={style.mensaje}>{mensajeVacio}</p>
        ) : (
          <div className={style.scroll} ref={scrollRef}>
            <table className={style.tabla}>
              <colgroup>
                <col className={style.cNumero} />
                <col className={style.cEmpleado} />
                <col className={`${style.cCargo} ${style.colCargo}`} />
                <col className={style.cIngreso} />
                <col className={style.cSalida} />
                <col className={`${style.cTotalL} ${style.colTotalL}`} />
                <col className={`${style.cTotalR} ${style.colTotalR}`} />
                <col className={`${style.cEstado} ${style.colEstado}`} />
                <col className={`${style.cIncidencias} ${style.colIncidencias}`} />
                <col className={style.cAcciones} />
              </colgroup>
              <thead>
                <tr>
                  <th className={style.colNumero}>N°</th>
                  <th>Empleado</th>
                  <th className={style.colCargo}>Cargo</th>
                  <th>Ingreso</th>
                  <th>Salida</th>
                  <th className={style.colTotalL}>Total L</th>
                  <th className={style.colTotalR}>Total R</th>
                  <th className={style.colEstado}>Estado</th>
                  <th className={style.colIncidencias}>Incidencias</th>
                  <th className={style.colAcciones}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((a, i) => {
                  const urlImagen = a.img_url;
                  const nombre = a.stff_name;
                  const apellido = a.stff_lastname;
                  const cargo = a.job_position_name;
                  const estado = getEstado(a);
                  const laborados = minutosLaborados(a);
                  const receso = minutosReceso(a);
                  const incidentes = getIncidentes(a);
                  const hayIngreso = a.att_schedule_start || a.att_refreshment_end;
                  const haySalida = a.att_refreshment_start || a.att_schedule_end;

                  return (
                    <tr
                      key={a.att_id}
                      onClick={() => setRegistroAbierto({ fila: a, pestana: "informacion" })}
                      className={resaltados.has(a.att_id) ? style.filaNueva : undefined}
                    >
                      <td className={style.colNumero}>{inicio + i + 1}</td>

                      <td>
                        <div className={style.empleado}>
                          {urlImagen ? (
                            <img src={urlImagen} alt={nombre} className={style.foto} />
                          ) : (
                            <div className={style.fotoVacia} aria-hidden="true">
                              {iniciales(nombre, apellido)}
                            </div>
                          )}
                          <div className={style.empleadoTexto}>
                            <span className={style.nombre} title={nombre}>{nombre}</span>
                            <span className={style.apellido} title={apellido}>{apellido}</span>
                          </div>
                        </div>
                      </td>

                      <td className={style.colCargo}>
                        {cargo ? (
                          <span className={style.cargo} title={cargo}>{cargo}</span>
                        ) : (
                          <span className={style.vacio}>—</span>
                        )}
                      </td>

                      <td>
                        {hayIngreso ? (
                          <div className={style.horas}>
                            <Hora valor={a.att_schedule_start} icono="reloj" />
                            <Hora valor={a.att_refreshment_end} icono="cafe" />
                          </div>
                        ) : (
                          <span className={style.vacio}>—</span>
                        )}
                      </td>

                      <td>
                        {haySalida ? (
                          <div className={style.horas}>
                            <Hora valor={a.att_refreshment_start} icono="cafe" />
                            <Hora valor={a.att_schedule_end} icono="reloj" />
                          </div>
                        ) : (
                          <span className={style.vacio}>—</span>
                        )}
                      </td>

                      <td className={style.colTotalL}>
                        {laborados !== null ? (
                          <span className={style.total}>{formatDuracion(laborados)}</span>
                        ) : (
                          <span className={style.vacio}>—</span>
                        )}
                      </td>

                      <td className={style.colTotalR}>
                        {receso !== null ? (
                          <span className={style.total}>{formatDuracion(receso)}</span>
                        ) : (
                          <span className={style.vacio}>—</span>
                        )}
                      </td>

                      <td className={style.colEstado}>
                        <span className={`${style.badge} ${BADGE_ESTADO[estado].clase}`}>
                          <span className={style.badgePunto} />
                          {BADGE_ESTADO[estado].texto}
                        </span>
                      </td>

                      <td className={style.colIncidencias}>
                        <span
                          className={`${style.incidentes} ${
                            incidentes > 0 ? style.incAlerta : style.incCero
                          }`}
                        >
                          {incidentes}
                        </span>
                      </td>

                      <td className={style.colAcciones}>
                        <button
                          type="button"
                          className={style.btnAcciones}
                          aria-label="Acciones"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenu({ fila: a, ancla: e.currentTarget.getBoundingClientRect() });
                          }}
                        >
                          <IconoPuntos />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hayRegistros && (
          <div className={style.pie}>
            <div className={style.paginacion}>
              <button
                type="button"
                className={style.pagBtn}
                disabled={paginaActual === 1}
                onClick={() => setPagina(paginaActual - 1)}
                aria-label="Página anterior"
              >
                <IconoFlecha />
              </button>

              {paginasVisibles(paginaActual, totalPaginas).map((n, idx) =>
                n === "…" ? (
                  <span key={`puntos-${idx}`} className={style.pagPuntos} aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    className={`${style.pagBtn} ${n === paginaActual ? style.pagActiva : ""}`}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                type="button"
                className={style.pagBtn}
                disabled={paginaActual === totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                aria-label="Página siguiente"
              >
                <IconoFlecha derecha />
              </button>
            </div>
          </div>
        )}
      </div>

      {registroAbierto && registroVivo && (
        <ModalRegistro
          key={`${registroAbierto.fila.att_id}-${registroAbierto.pestana}`}
          registro={registroVivo}
          pestanaInicial={registroAbierto.pestana}
          onClose={() => setRegistroAbierto(null)}
          onFilaActualizada={onActualizarFila}
        />
      )}

      {menu && (
        <ModalTresPuntos
          ancla={menu.ancla}
          onClose={() => setMenu(null)}
          onVerInformacion={() => {
            setRegistroAbierto({ fila: menu.fila, pestana: "informacion" });
            setMenu(null);
          }}
          onEditar={() => {
            setRegistroAbierto({ fila: menu.fila, pestana: "editar" });
            setMenu(null);
          }}
          onEliminar={() => {
            setPorEliminar(menu.fila);
            setMenu(null);
          }}
        />
      )}

      {porEliminar && (
        <ConfirmarEliminar
          onCancelar={() => setPorEliminar(null)}
          onConfirmar={() => {
            const attId = porEliminar.att_id;
            setPorEliminar(null);
            setErrorEliminar("");
            onEliminarRegistro(attId).catch((error) =>
              setErrorEliminar(
                error instanceof Error ? error.message : "No se pudo eliminar el registro."
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default Seccion_4;