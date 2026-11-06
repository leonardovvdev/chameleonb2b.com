import { useEffect, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import style from "./modal.module.css";
import type { PersonaResumen } from "../../../types/register.types";

export type VarianteModal = "azul" | "verde" | "naranja" | "rojo";

export interface SeccionLista {
  /** Subtítulo de la sección (opcional si el modal tiene una sola lista). */
  titulo?: string;
  personas: PersonaResumen[];
  /** Texto cuando la lista está vacía. */
  vacio: string;
}

interface ModalListaPersonalProps {
  titulo: string;
  icono: ReactNode;
  variante: VarianteModal;
  secciones: SeccionLista[];
  onClose: () => void;
}

const iniciales = (nombre?: string, apellido?: string) =>
  `${nombre?.trim()[0] ?? ""}${apellido?.trim()[0] ?? ""}`.toUpperCase();

const ModalListaPersonal = ({
  titulo,
  icono,
  variante,
  secciones,
  onClose,
}: ModalListaPersonalProps) => {
  // Persona con la justificación desplegada ("indiceSeccion-stff_id"). Una a la vez.
  const [expandido, setExpandido] = useState<string | null>(null);

  // Cierra con ESC y bloquea el scroll de la página mientras está abierto.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose]);

  const total = secciones.reduce((suma, s) => suma + s.personas.length, 0);

  const alternar = (clave: string) =>
    setExpandido((actual) => (actual === clave ? null : clave));

  return createPortal(
    <div className={style.overlay} onClick={onClose}>
      <div
        className={`${style.modal} ${style[variante]}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={style.header}>
          <span className={style.iconoCaja}>{icono}</span>
          <div className={style.headerTextos}>
            <h3 className={style.titulo}>{titulo}</h3>
            <p className={style.subtitulo}>
              {total} {total === 1 ? "persona" : "personas"}
            </p>
          </div>
          <button type="button" className={style.cerrar} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className={style.cuerpo}>
          {secciones.map((seccion, i) => (
            <section key={seccion.titulo ?? i} className={style.seccion}>
              {seccion.titulo && (
                <h4 className={style.seccionTitulo}>
                  {seccion.titulo}
                  <span className={style.contador}>{seccion.personas.length}</span>
                </h4>
              )}

              {seccion.personas.length === 0 ? (
                <p className={style.vacio}>{seccion.vacio}</p>
              ) : (
                <ul className={style.lista}>
                  {seccion.personas.map((p) => {
                    const clave = `${i}-${p.stff_id}`;
                    const justificacion = p.justificacion?.trim() ?? "";
                    const justificado = justificacion !== "";
                    const abierto = justificado && expandido === clave;

                    const interaccion = justificado
                      ? {
                          role: "button" as const,
                          tabIndex: 0,
                          "aria-expanded": abierto,
                          onClick: () => alternar(clave),
                          onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              alternar(clave);
                            }
                          },
                        }
                      : {};

                    return (
                      <li
                        key={clave}
                        className={`${style.item} ${justificado ? style.justificable : ""} ${
                          abierto ? style.abierto : ""
                        }`}
                      >
                        <div className={style.itemFila} {...interaccion}>
                          {p.img_url ? (
                            <img src={p.img_url} alt="" className={style.foto} />
                          ) : (
                            <span className={style.fotoVacia} aria-hidden="true">
                              {iniciales(p.stff_name, p.stff_lastname)}
                            </span>
                          )}
                          <span className={style.nombreCompleto}>
                            <span className={style.nombre}>{p.stff_name}</span>
                            <span className={style.apellido}>{p.stff_lastname}</span>
                          </span>

                          {justificado && (
                            <span className={style.badgeJustificado}>
                              Justificado
                              <svg
                                className={style.flecha}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </span>
                          )}
                        </div>

                        {justificado && (
                          <div className={style.detalle} aria-hidden={!abierto}>
                            <div className={style.detalleInterno}>
                              <textarea
                                className={style.justificacion}
                                value={justificacion}
                                readOnly
                                rows={3}
                                tabIndex={abierto ? 0 : -1}
                                aria-label="Justificación"
                              />
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalListaPersonal;