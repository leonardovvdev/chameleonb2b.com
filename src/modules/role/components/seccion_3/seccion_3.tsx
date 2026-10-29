import { useState, type CSSProperties } from "react";

import style from "./seccion_3.module.css";
import Modal, { type ModoModal } from "../seccion_1/shared/modal";

import {
  useRoleController,
  type RoleFilters,
} from "../../controllers/role.controller";
import type { Role } from "../../types/role.types";

const TOTAL_COLUMNAS = 3;

interface Seccion3Props {
  filtros: RoleFilters;
  recargaKey: number;
}

interface AccionRol {
  modo: Exclude<ModoModal, "crear">;
  rol: Role;
}

const Seccion_3 = ({ filtros, recargaKey }: Seccion3Props) => {
  const {
    rolesPagina,
    loading,
    error,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    itemsPorPagina,
    recargar,
  } = useRoleController(filtros, recargaKey);

  const [accion, setAccion] = useState<AccionRol | null>(null);
  // Dirección de la animación: 1 = avanzar, -1 = retroceder
  const [direccion, setDireccion] = useState<1 | -1>(1);

  const irAPagina = (nueva: number) => {
    if (nueva < 1 || nueva > totalPaginas || nueva === paginaActual) return;
    setDireccion(nueva > paginaActual ? 1 : -1);
    setPaginaActual(nueva);
  };

  const sinFilas = rolesPagina.length === 0;

  return (
    <div className={style.seccion}>
      {error && <span className={style.textoError}>{error}</span>}

      {sinFilas && loading ? (
        <p>Cargando roles...</p>
      ) : sinFilas ? (
        <p>
          {filtros.busqueda.trim() !== ""
            ? "No se encontraron resultados con los filtros aplicados."
            : "No hay roles registrados."}
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
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {rolesPagina.map((rol) => (
                    <tr key={rol.id}>
                      <td>{rol.name}</td>
                      <td>{rol.description || "—"}</td>
                      <td className={style.acciones}>
                        <button
                          type="button"
                          className={style.botonAccion}
                          onClick={() => setAccion({ modo: "editar", rol })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={style.botonAccion}
                          onClick={() => setAccion({ modo: "eliminar", rol })}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {Array.from({
                    length: Math.max(0, itemsPorPagina - rolesPagina.length),
                  }).map((_, i) => (
                    <tr key={`vacia-${i}`} className={style.filaVacia}>
                      <td colSpan={TOTAL_COLUMNAS}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={style.paginacion}>
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
          </div>
        </>
      )}

      {accion && (
        <Modal
          modo={accion.modo}
          rol={accion.rol}
          onClose={() => setAccion(null)}
          onGuardado={() => {
            setAccion(null);
            recargar();
          }}
        />
      )}
    </div>
  );
};

export default Seccion_3;