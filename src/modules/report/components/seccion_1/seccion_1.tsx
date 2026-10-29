import { useState } from "react";
import style from "./seccion_1.module.css";

// Datos de ejemplo (sin backend)
const PERSONAL = [
  { nombre: "Lucía Ramírez", cargo: "Cajera", contratos: 3 },
  { nombre: "Carlos Mendoza", cargo: "Almacenero", contratos: 2 },
  { nombre: "Rosa Quispe", cargo: "Vendedora", contratos: 1 },
];

const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Seccion_1 = () => {
  const [actual, setActual] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const persona = PERSONAL[actual];

  return (
    <div className={style.seccion}>
      <div className={style.persona}>
        <div className={style.avatar}>{iniciales(persona.nombre)}</div>

        <div className={style.info}>
          <span className={style.nombre}>{persona.nombre}</span>
          <span className={style.cargo}>
            {persona.cargo} · {persona.contratos} contratos
          </span>
        </div>

        <div className={style.cambiarWrap}>
          <button
            type="button"
            className={style.cambiar}
            onClick={() => setAbierto((v) => !v)}
          >
            Cambiar personal
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {abierto && (
            <ul className={style.menu}>
              {PERSONAL.map((p, i) => (
                <li key={p.nombre}>
                  <button
                    type="button"
                    className={i === actual ? style.itemActivo : style.item}
                    onClick={() => {
                      setActual(i);
                      setAbierto(false);
                    }}
                  >
                    {p.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button type="button" className={style.excel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Descargar Excel
      </button>
    </div>
  );
};

export default Seccion_1;
