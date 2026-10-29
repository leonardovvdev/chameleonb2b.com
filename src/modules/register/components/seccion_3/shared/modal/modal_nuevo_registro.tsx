// modal_nuevo_registro.tsx
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import style from "./modal_nuevo_registro.module.css";
import { formatHora, getFechaLocalHoy, textoFecha } from "../../../../controllers/register.controller";
import type { NuevoRegistroControl, StaffPendiente } from "../../../../types/register.types";

/* ───────── Iconos (SVG propios) ───────── */
const Svg = ({ className, children }: { className?: string; children: ReactNode }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconoBuscar = () => (
  <Svg className={style.icono}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

const IconoFiltro = () => (
  <Svg className={style.icono}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

const IconoFlecha = () => (
  <Svg className={style.icono}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

const IconoAtras = () => (
  <Svg className={style.iconoBoton}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

const IconoCerrar = () => (
  <Svg className={style.iconoBoton}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

const IconoOk = () => (
  <Svg className={style.iconoAviso}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.8 2.8L16 9.5" />
  </Svg>
);

const IconoAlerta = () => (
  <Svg className={style.iconoAviso}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </Svg>
);

const IconoCalendario = () => (
  <Svg className={style.icono}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </Svg>
);

const IconoReloj = () => (
  <Svg className={style.icono}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

const IconoDocumento = () => (
  <Svg className={style.icono}>
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <path d="M8 10h3M8 14h8" />
  </Svg>
);

/* ───────── Foto o iniciales ───────── */
const Foto = ({ staff, grande }: { staff: StaffPendiente; grande?: boolean }) => {
  const clase = grande ? style.fotoGrande : style.foto;
  if (staff.img_url) {
    return <img src={staff.img_url} alt="" className={clase} loading="lazy" />;
  }
  const iniciales = `${staff.stff_name.charAt(0)}${staff.stff_lastname.charAt(0)}`.toUpperCase();
  return (
    <span className={`${clase} ${style.fotoVacia}`} aria-hidden="true">
      {iniciales}
    </span>
  );
};

/* ───────── Hora actual (se refresca mientras se ve el detalle) ───────── */
const useHoraActual = (activo: boolean) => {
  const [hora, setHora] = useState(() => formatHora(new Date().toISOString()));

  useEffect(() => {
    if (!activo) return;
    const actualizar = () => setHora(formatHora(new Date().toISOString()));
    actualizar();
    const temporizador = setInterval(actualizar, 15_000);
    return () => clearInterval(temporizador);
  }, [activo]);

  return hora;
};

interface ModalNuevoRegistroProps {
  control: NuevoRegistroControl;
}

const ModalNuevoRegistro = ({ control }: ModalNuevoRegistroProps) => {
  const {
    cerrar,
    modo,
    personal,
    cargando,
    busqueda,
    onCambiarBusqueda,
    filtro,
    onCambiarFiltro,
    cargos,
    roles,
    seleccionado,
    onSeleccionar,
    onCancelarSeleccion,
    onConfirmar,
    registrando,
    descripcion,
    onCambiarDescripcion,
    maxDescripcion,
    error,
    exito,
  } = control;

  const inputRef = useRef<HTMLInputElement>(null);
  const esAusencia = modo === "ausencia";
  const enDetalle = seleccionado !== null;
  const descripcionVacia = descripcion.trim() === "";
  const horaActual = useHoraActual(enDetalle && !esAusencia);

  // El cursor queda en el buscador al abrir y cada vez que se vuelve a la lista.
  useEffect(() => {
    if (!enDetalle) inputRef.current?.focus();
  }, [enDetalle]);

  // ESC: en el detalle vuelve a la lista; en la lista cierra el modal.
  useEffect(() => {
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (enDetalle) {
        if (!registrando) onCancelarSeleccion();
      } else {
        cerrar();
      }
    };
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [enDetalle, registrando, onCancelarSeleccion, cerrar]);

  const hayBusqueda = busqueda.trim() !== "" || filtro !== "";
  const mensajeVacio = hayBusqueda
    ? "No se encontró personal con los filtros aplicados."
    : esAusencia
      ? "Todo el personal activo ya tiene un registro hoy."
      : "Todo el personal activo ya registró su ingreso hoy.";

  const titulo = enDetalle
    ? esAusencia
      ? "Registrar ausencia"
      : "Registrar asistencia"
    : esAusencia
      ? "Registrar ausencia"
      : "Nuevo registro";

  const subtitulo = enDetalle
    ? "Revisa los datos antes de confirmar."
    : esAusencia
      ? "Selecciona al colaborador que no asistió hoy."
      : "Selecciona al colaborador que registrará su ingreso de hoy.";

  const hoy = getFechaLocalHoy();

  return (
    <div className={style.overlay} onClick={registrando ? undefined : cerrar}>
      <div
        className={style.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-registro"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <header className={style.encabezado}>
          {enDetalle && (
            <button
              type="button"
              className={style.botonIcono}
              onClick={onCancelarSeleccion}
              disabled={registrando}
              aria-label="Volver a la lista"
            >
              <IconoAtras />
            </button>
          )}
          <div className={style.encabezadoTexto}>
            <h3 id="titulo-nuevo-registro" className={style.titulo}>
              {titulo}
            </h3>
            <p className={style.subtitulo}>{subtitulo}</p>
          </div>
          <button
            type="button"
            className={style.botonIcono}
            onClick={cerrar}
            disabled={registrando}
            aria-label="Cerrar"
          >
            <IconoCerrar />
          </button>
        </header>

        {!enDetalle ? (
          <>
            {/* Buscador + filtro (cargo o rol) */}
            <div className={style.filtros}>
              <label className={style.caja}>
                <IconoBuscar />
                <input
                  ref={inputRef}
                  type="search"
                  className={style.input}
                  placeholder="Buscar por nombre, apellido o DNI..."
                  value={busqueda}
                  onChange={(e) => onCambiarBusqueda(e.target.value)}
                  aria-label="Buscar personal"
                />
              </label>

              <label className={style.caja}>
                <IconoFiltro />
                <select
                  className={style.select}
                  value={filtro}
                  onChange={(e) => onCambiarFiltro(e.target.value)}
                  aria-label="Filtrar por cargo o rol"
                >
                  <option value="">Todos los cargos y roles</option>
                  {cargos.length > 0 && (
                    <optgroup label="Cargos">
                      {cargos.map((cargo) => (
                        <option key={`cargo:${cargo.id}`} value={`cargo:${cargo.id}`}>
                          {cargo.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {roles.length > 0 && (
                    <optgroup label="Roles">
                      {roles.map((rol) => (
                        <option key={`rol:${rol.id}`} value={`rol:${rol.id}`}>
                          {rol.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <IconoFlecha />
              </label>
            </div>

            {/* Avisos */}
            {exito && (
              <p className={`${style.aviso} ${style.avisoOk}`} role="status">
                <IconoOk />
                {exito}
              </p>
            )}
            {error && (
              <p className={`${style.aviso} ${style.avisoError}`} role="alert">
                <IconoAlerta />
                {error}
              </p>
            )}

            {/* Lista del personal */}
            <div className={style.cuerpo}>
              {cargando && personal.length === 0 ? (
                <p className={style.mensaje}>Cargando personal...</p>
              ) : personal.length === 0 ? (
                <p className={style.mensaje}>{mensajeVacio}</p>
              ) : (
                <ul className={style.lista}>
                  {personal.map((staff) => (
                    <li key={staff.stff_id}>
                      <button type="button" className={style.tarjeta} onClick={() => onSeleccionar(staff)}>
                        <Foto staff={staff} />
                        <span className={style.nombre} title={staff.stff_name}>
                          {staff.stff_name}
                        </span>
                        <span className={style.apellido} title={staff.stff_lastname}>
                          {staff.stff_lastname}
                        </span>
                        {staff.job_position_name && (
                          <span className={style.cargo} title={staff.job_position_name}>
                            {staff.job_position_name}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className={style.pie}>
              {personal.length} {personal.length === 1 ? "colaborador pendiente" : "colaboradores pendientes"}
            </footer>
          </>
        ) : (
          <>
            {/* Detalle: registrar asistencia / ausencia */}
            <div className={`${style.cuerpo} ${style.cuerpoDetalle}`}>
              <section className={style.detalle}>
                <div className={style.perfil}>
                  <Foto staff={seleccionado} grande />
                  <div className={style.perfilTexto}>
                    <span className={`${style.etiqueta} ${esAusencia ? style.etiquetaAusencia : style.etiquetaIngreso}`}>
                      {esAusencia ? "Ausencia" : "Ingreso"}
                    </span>
                    <h4 className={style.perfilNombre}>
                      {seleccionado.stff_name} {seleccionado.stff_lastname}
                    </h4>
                    <p className={style.perfilCargo}>
                      {[seleccionado.job_position_name, seleccionado.role_name].filter(Boolean).join(" · ") ||
                        "Sin cargo asignado"}
                    </p>
                  </div>
                </div>

                <dl className={style.datos}>
                  <div className={style.dato}>
                    <dt className={style.datoTitulo}>
                      <IconoDocumento />
                      DNI
                    </dt>
                    <dd className={style.datoValor}>{seleccionado.stff_dni}</dd>
                  </div>
                  <div className={style.dato}>
                    <dt className={style.datoTitulo}>
                      <IconoCalendario />
                      Fecha
                    </dt>
                    <dd className={style.datoValor}>{textoFecha(hoy, true)}</dd>
                  </div>
                  {!esAusencia && (
                    <div className={style.dato}>
                      <dt className={style.datoTitulo}>
                        <IconoReloj />
                        Hora de ingreso
                      </dt>
                      <dd className={style.datoValor}>{horaActual}</dd>
                    </div>
                  )}
                </dl>

                {esAusencia ? (
                  <div className={style.campo}>
                    <label htmlFor="descripcion-ausencia" className={style.campoTitulo}>
                      Motivo de la ausencia <span className={style.obligatorio}>*</span>
                    </label>
                    <textarea
                      id="descripcion-ausencia"
                      className={style.textarea}
                      value={descripcion}
                      onChange={(e) => onCambiarDescripcion(e.target.value)}
                      maxLength={maxDescripcion}
                      rows={4}
                      placeholder="Escribe la descripción de la ausencia..."
                      aria-required="true"
                      disabled={registrando}
                      autoFocus
                    />
                    <div className={style.campoPie}>
                      <span className={style.ayuda}>{descripcionVacia ? "La descripción es obligatoria." : ""}</span>
                      <span className={style.contador}>
                        {descripcion.length}/{maxDescripcion}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={style.nota}>
                    El ingreso se guardará con la hora del servidor al confirmar.
                  </p>
                )}
              </section>
            </div>

            <footer className={style.acciones}>
              <button
                type="button"
                className={style.botonSecundario}
                onClick={onCancelarSeleccion}
                disabled={registrando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={style.botonPrimario}
                onClick={onConfirmar}
                disabled={registrando || (esAusencia && descripcionVacia)}
                autoFocus={!esAusencia}
              >
                {registrando ? "Registrando..." : esAusencia ? "Registrar ausencia" : "Confirmar asistencia"}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalNuevoRegistro;
