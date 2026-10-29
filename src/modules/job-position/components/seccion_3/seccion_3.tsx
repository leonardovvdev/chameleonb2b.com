import { useState, type CSSProperties } from "react";

import style from "./seccion_3.module.css";
import Modal, { type ModoModal } from "../seccion_1/shared/modal";

import {
  useJobPositionController,
  type JobPositionFilters,
} from "../../controllers/job-position.controller";
import type { JobPosition } from "../../types/job-position.types";

const TOTAL_COLUMNAS_TABLA = 3; // Nombre, Descripción, Acciones

interface Seccion3Props {
  filtros: JobPositionFilters;
  /** Lo sube la página cuando seccion_1 crea un cargo → fuerza recargar la tabla. */
  recargaKey: number;
}

/** Acción que el usuario eligió sobre una fila (crear se hace en seccion_1). */
interface AccionSobreCargo {
  modo: Exclude<ModoModal, "crear">; // "editar" | "eliminar"
  cargo: JobPosition;
}

const Seccion_3 = ({ filtros, recargaKey }: Seccion3Props) => {
  // Los datos (traer, filtrar, paginar) vienen del hook. Esta sección solo los dibuja.
  const {
    cargosDeLaPaginaActual,
    cargando,
    mensajeError,
    paginaActual,
    cambiarPagina,
    totalPaginas,
    cargosPorPagina,
    volverACargarCargos,
  } = useJobPositionController(filtros, recargaKey);

  // Fila + acción elegida (null = no hay modal abierto).
  const [accionSobreCargo, setAccionSobreCargo] = useState<AccionSobreCargo | null>(null);

  // Dirección de la animación al cambiar de página: 1 = avanzar, -1 = retroceder
  const [direccionAnimacion, setDireccionAnimacion] = useState<1 | -1>(1);

  const irAPagina = (paginaDestino: number) => {
    if (paginaDestino < 1 || paginaDestino > totalPaginas || paginaDestino === paginaActual) return;
    setDireccionAnimacion(paginaDestino > paginaActual ? 1 : -1);
    cambiarPagina(paginaDestino);
  };

  const noHayCargosParaMostrar = cargosDeLaPaginaActual.length === 0;

  return (
    <div className={style.seccion}>
      {mensajeError && <span className={style.textoError}>{mensajeError}</span>}

      {/* Hay 3 casos: cargando · sin resultados · tabla con datos */}
      {noHayCargosParaMostrar && cargando ? (
        <p>Cargando cargos...</p>
      ) : noHayCargosParaMostrar ? (
        <p>
          {filtros.busqueda.trim() !== ""
            ? "No se encontraron resultados con los filtros aplicados."
            : "No hay cargos registrados."}
        </p>
      ) : (
        <>
          {/* ── Tabla ─────────────────────────────────────────────────────── */}
          <div className={style.tablaViewport}>
            {/* key={paginaActual}: al cambiar de página el bloque se re-anima */}
            <div
              key={paginaActual}
              className={style.tablaPagina}
              style={{ "--dir": direccionAnimacion } as CSSProperties}
            >
              <table className={style.tabla}>
                {/* Anchos fijos de columna (definidos en el CSS) */}
                <colgroup>
                  <col className={style.colNombre} />
                  <col className={style.colDescripcion} />
                  <col className={style.colAcciones} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {cargosDeLaPaginaActual.map((cargo) => (
                    <tr key={cargo.id}>
                      <td className={style.celdaTexto} title={cargo.name}>
                        {cargo.name}
                      </td>
                      <td className={style.celdaTexto} title={cargo.description ?? undefined}>
                        {cargo.description || "—"}
                      </td>
                      <td className={style.acciones}>
                        <button
                          type="button"
                          className={style.botonAccion}
                          onClick={() => setAccionSobreCargo({ modo: "editar", cargo })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${style.botonAccion} ${style.botonPeligro}`}
                          onClick={() => setAccionSobreCargo({ modo: "eliminar", cargo })}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Filas vacías: la tabla mantiene siempre el mismo alto */}
                  {Array.from({
                    length: Math.max(0, cargosPorPagina - cargosDeLaPaginaActual.length),
                  }).map((_, i) => (
                    <tr key={`vacia-${i}`} className={style.filaVacia}>
                      <td colSpan={TOTAL_COLUMNAS_TABLA}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Paginación ────────────────────────────────────────────────── */}
          <div className={style.paginacion}>
            <button
              type="button"
              aria-label="Página anterior"
              disabled={paginaActual === 1}
              onClick={() => irAPagina(paginaActual - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numeroDePagina) => (
              <button
                type="button"
                key={numeroDePagina}
                className={numeroDePagina === paginaActual ? style.paginaActiva : undefined}
                onClick={() => irAPagina(numeroDePagina)}
              >
                {numeroDePagina}
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
          </div>
        </>
      )}

      {/* ── Modal de editar / eliminar ──────────────────────────────────────── */}
      {accionSobreCargo && (
        <Modal
          modo={accionSobreCargo.modo}
          cargo={accionSobreCargo.cargo}
          onClose={() => setAccionSobreCargo(null)}
          onGuardado={() => {
            setAccionSobreCargo(null);
            volverACargarCargos(); // refresca la tabla con los cambios
          }}
        />
      )}
    </div>
  );
};

export default Seccion_3;