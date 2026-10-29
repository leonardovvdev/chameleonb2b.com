import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import style from "./seccion_3.module.css";
import Modal, { ConfirmarTerminarContrato } from "./shared/modal";
import ModalInformation, { type PestanaPersonal } from "./shared/modal_information";
// Modal de seccion_1: con `stffId` edita y vuelve a contratar; sin `stffId` crea.
import ModalPersonal from "../seccion_1/shared/modal";

import { useStaffController } from "../../controllers/list.controller";
import type { StaffFilters, StaffListItem } from "../../../../core/types";

/* ───────────────────────── Constantes de layout ─────────────────────────
 * Se pasan al CSS como variables, así la medición y el render comparten
 * los mismos valores.
 */
const TOTAL_COLUMNAS = 7;
const ALTO_FILA = 56; // px por fila del tbody
const ALTO_HEADER = 44; // px del thead
const ALTO_PAGINACION = 44; // 28px de botones + 16px de margen superior
const PADDING_SECCION = 20; // padding vertical de la tarjeta (arriba y abajo)
const SEPARACION_INFERIOR = 20; // espacio entre la tarjeta y el borde inferior
const FILAS_MIN = 3;
const FILAS_MAX = 50;
const RETARDO_RESIZE_MS = 150;

/* ───────────────────────── Hook: filas por pantalla ───────────────────────── */

/**
 * Posición vertical del elemento respecto al viewport cuando ningún
 * contenedor está desplazado. Suma el scroll de la ventana y el de cualquier
 * contenedor padre con scroll, así funciona igual si el scroll es de la
 * página o de un contenedor interno.
 */
const topEnReposo = (el: HTMLElement) => {
  let desplazamiento = window.scrollY;
  for (
    let padre = el.parentElement;
    padre && padre !== document.body && padre !== document.documentElement;
    padre = padre.parentElement
  ) {
    desplazamiento += padre.scrollTop;
  }
  return el.getBoundingClientRect().top + desplazamiento;
};

/**
 * Calcula cuántas filas caben sin generar scroll, dejando
 * SEPARACION_INFERIOR px libres abajo. Devuelve `null` hasta la primera
 * medición.
 */
const useFilasPorPantalla = (ref: RefObject<HTMLElement | null>) => {
  const [filas, setFilas] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calcular = () => {
      const disponible =
        window.innerHeight -
        topEnReposo(el) -
        SEPARACION_INFERIOR -
        PADDING_SECCION * 2 -
        ALTO_HEADER -
        ALTO_PAGINACION;

      const calculadas = Math.min(
        FILAS_MAX,
        Math.max(FILAS_MIN, Math.floor(disponible / ALTO_FILA))
      );

      setFilas((prev) => (prev === calculadas ? prev : calculadas));
    };

    calcular(); // primera medición antes del primer pintado

    // Las siguientes se agrupan para no consultar mientras se arrastra la ventana.
    let temporizador: ReturnType<typeof setTimeout>;
    const programar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(calcular, RETARDO_RESIZE_MS);
    };

    window.addEventListener("resize", programar);

    // También reacciona si cambia la altura de lo que hay encima (filtros, etc.)
    const observador = new ResizeObserver(programar);
    if (el.parentElement) observador.observe(el.parentElement);

    return () => {
      clearTimeout(temporizador);
      window.removeEventListener("resize", programar);
      observador.disconnect();
    };
  }, [ref]);

  return filas;
};

/* ───────────────────────── Helpers ───────────────────────── */

const hayFiltrosActivos = (f: StaffFilters) =>
  f.busqueda.trim() !== "" ||
  f.cargoId !== null ||
  f.rolId !== null ||
  f.estado !== "";

/* ───────────────────────── Componente ───────────────────────── */

interface Seccion3Props {
  filtros: StaffFilters;
}

const Seccion_3 = ({ filtros }: Seccion3Props) => {
  const seccionRef = useRef<HTMLDivElement>(null);
  const itemsPorPagina = useFilasPorPantalla(seccionRef);

  const {
    staffsPagina,
    loading,
    error,
    menuAbierto,
    setMenuAbierto,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    terminarContrato,
    actualizarStaffLocal,
    recargar,
  } = useStaffController(filtros, itemsPorPagina);

  // Modal con las pestañas "Ver fotocheck" y "Editar"
  const [personalAbierto, setPersonalAbierto] = useState<{
    staff: StaffListItem;
    tab: PestanaPersonal;
  } | null>(null);
  // Confirmación de "Terminar contrato"
  const [staffTerminar, setStaffTerminar] = useState<StaffListItem | null>(null);
  const [terminando, setTerminando] = useState(false);
  const [errorTerminar, setErrorTerminar] = useState<string | null>(null);
  // Id del personal que se vuelve a contratar (abre el modal de seccion_1 en modo editar)
  const [idContratar, setIdContratar] = useState<number | null>(null);

  const abrirPersonal = (staff: StaffListItem, tab: PestanaPersonal) => {
    setMenuAbierto(null);
    setPersonalAbierto({ staff, tab });
  };

  const confirmarTerminar = async () => {
    if (!staffTerminar || terminando) return;
    setTerminando(true);
    setErrorTerminar(null);
    try {
      await terminarContrato(staffTerminar);
      setStaffTerminar(null);
    } catch (err) {
      console.error("Error al terminar el contrato:", err);
      // El backend responde con el motivo (por ejemplo, si no es Administrador)
      setErrorTerminar(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo terminar el contrato. Intenta de nuevo."
      );
    } finally {
      setTerminando(false);
    }
  };
  // Dirección de la animación: 1 = avanzar, -1 = retroceder
  const [direccion, setDireccion] = useState<1 | -1>(1);

  const irAPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPaginas || nueva === paginaActual) return;
    setDireccion(nueva > paginaActual ? 1 : -1);
    setMenuAbierto(null);
    setPaginaActual(nueva);
  };

  const sinFilas = staffsPagina.length === 0;
  const filasVacias = Math.max(0, (itemsPorPagina ?? 0) - staffsPagina.length);

  const variablesLayout = {
    "--alto-fila": `${ALTO_FILA}px`,
    "--alto-header": `${ALTO_HEADER}px`,
    "--alto-paginacion": `${ALTO_PAGINACION}px`,
    "--padding-seccion": `${PADDING_SECCION}px`,
    "--separacion-inferior": `${SEPARACION_INFERIOR}px`,
  } as CSSProperties;

  return (
    <div ref={seccionRef} className={style.seccion} style={variablesLayout}>
      {error && <span className={style.textoError}>{error}</span>}

      {sinFilas && loading ? (
        <p>Cargando personales...</p>
      ) : sinFilas ? (
        <p>
          {hayFiltrosActivos(filtros)
            ? "No se encontraron resultados con los filtros aplicados."
            : "No hay personales registrados."}
        </p>
      ) : (
        <>
          <div className={style.tablaViewport}>
            {/* key={paginaActual}: al cambiar de página el bloque se re-anima */}
            <div
              key={paginaActual}
              className={style.tablaPagina}
              style={{ "--dir": direccion } as CSSProperties}
            >
              <table className={style.tabla}>
                <colgroup>
                  <col className={style.colFoto} />
                  <col className={style.colNombre} />
                  <col className={style.colDni} />
                  <col className={style.colTelefono} />
                  <col className={style.colCargo} />
                  <col className={style.colEstado} />
                  <col className={style.colAcciones} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>DNI</th>
                    <th>Teléfono</th>
                    <th>Cargo</th>
                    <th>Estado</th>
                    <th className={style.acciones}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {staffsPagina.map((staff) => {
                    const urlImagen = staff.img_url;
                    const nombreCompleto = `${staff.stff_name} ${staff.stff_lastname}`;
                    const cargo = staff.job_position_name || "—";

                    return (
                      <tr
                        key={staff.stff_id}
                        className={style.filaClicable}
                        onClick={() => abrirPersonal(staff, "ver")}
                      >
                        <td>
                          {urlImagen ? (
                            <img
                              src={urlImagen}
                              alt={nombreCompleto}
                              className={style.foto}
                              decoding="async"
                            />
                          ) : (
                            <div className={style.fotoVacia} />
                          )}
                        </td>

                        <td className={style.celdaTexto} title={nombreCompleto}>
                          {nombreCompleto}
                        </td>
                        <td>{staff.stff_dni}</td>
                        <td>{staff.stff_phone || "—"}</td>
                        <td className={style.celdaTexto} title={cargo}>
                          {cargo}
                        </td>

                        <td>
                          <span
                            className={
                              staff.stff_active
                                ? style.badgeActivo
                                : style.badgeInactivo
                            }
                          >
                            {staff.stff_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className={style.acciones} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={style.botonMenu}
                            aria-label={`Acciones para ${nombreCompleto}`}
                            onClick={() =>
                              setMenuAbierto(
                                menuAbierto === staff.stff_id ? null : staff.stff_id
                              )
                            }
                          >
                            ⋮
                          </button>

                          {menuAbierto === staff.stff_id && (
                            <Modal
                              onClose={() => setMenuAbierto(null)}
                              opciones={[
                                {
                                  label: "Ver fotocheck",
                                  onClick: () => abrirPersonal(staff, "ver"),
                                },
                                {
                                  label: "Editar",
                                  onClick: () => abrirPersonal(staff, "editar"),
                                },
                                staff.stff_active
                                  ? {
                                      label: "Terminar contrato",
                                      peligro: true,
                                      onClick: () => {
                                        setMenuAbierto(null);
                                        setErrorTerminar(null);
                                        setStaffTerminar(staff);
                                      },
                                    }
                                  : {
                                      label: "Contratar",
                                      onClick: () => {
                                        setMenuAbierto(null);
                                        setIdContratar(staff.stff_id);
                                      },
                                    },
                              ]}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Relleno para mantener siempre la misma altura de tabla */}
                  {Array.from({ length: filasVacias }, (_, i) => (
                    <tr key={`vacia-${i}`} className={style.filaVacia}>
                      <td colSpan={TOTAL_COLUMNAS} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <nav className={style.paginacion} aria-label="Paginación de personal">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={paginaActual === 1}
              onClick={() => irAPagina(paginaActual - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
              <button
                type="button"
                key={num}
                className={num === paginaActual ? style.paginaActiva : undefined}
                aria-current={num === paginaActual ? "page" : undefined}
                onClick={() => irAPagina(num)}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              aria-label="Página siguiente"
              disabled={paginaActual === totalPaginas}
              onClick={() => irAPagina(paginaActual + 1)}
            >
              ›
            </button>
          </nav>
        </>
      )}

      {personalAbierto && (
        <ModalInformation
          // key: si se abre otro registro, el modal empieza de cero
          key={`${personalAbierto.staff.stff_id}-${personalAbierto.tab}`}
          staff={personalAbierto.staff}
          tabInicial={personalAbierto.tab}
          onClose={() => setPersonalAbierto(null)}
          onActualizado={(cambios) => {
            // 1) La fila de la tabla cambia al instante.
            actualizarStaffLocal(personalAbierto.staff.stff_id, cambios);
            setPersonalAbierto((prev) =>
              prev ? { ...prev, staff: { ...prev.staff, ...cambios } } : prev
            );
            // 2) En segundo plano se confirma con el servidor (filtros, orden, conteo).
            void recargar();
          }}
        />
      )}

      {idContratar !== null && (
        <ModalPersonal
          key={idContratar}
          stffId={idContratar}
          onClose={() => setIdContratar(null)}
          // Quedó activo y con nuevo contrato: se refresca la lista
          onGuardado={() => void recargar()}
        />
      )}

      {staffTerminar && (
        <ConfirmarTerminarContrato
          nombreCompleto={`${staffTerminar.stff_name} ${staffTerminar.stff_lastname}`}
          procesando={terminando}
          error={errorTerminar}
          onConfirmar={confirmarTerminar}
          onCancelar={() => setStaffTerminar(null)}
        />
      )}
    </div>
  );
};

export default Seccion_3;