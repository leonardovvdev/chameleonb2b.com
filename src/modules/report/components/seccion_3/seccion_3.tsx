import { useState } from "react";
import style from "./seccion_3.module.css";
import Modal from "./shared/modal";

// Datos de ejemplo (sin backend)
const CONTRATOS = [
  { nombre: "CONTRATO 1", rango: "02/05/2023 → 30/04/2024", estado: "Liquidado" },
  { nombre: "CONTRATO 2", rango: "01/05/2024 → 30/04/2025", estado: "Liquidado" },
  { nombre: "CONTRATO 3", rango: "01/05/2025 → Actual", estado: "Vigente" },
];

const Seccion_3 = () => {
  const [contrato, setContrato] = useState(0);
  const [abierto, setAbierto] = useState(false);

  const c = CONTRATOS[contrato];

  return (
    <div className={style.seccion}>
      {/* Contrato */}
      <div className={style.contratoWrap}>
        <button type="button" className={style.contrato} onClick={() => setAbierto((v) => !v)}>
          <div>
            <div className={style.contratoNombre}>{c.nombre}</div>
            <div className={style.contratoRango}>{c.rango}</div>
            <span className={style.badge}>{c.estado}</span>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#c7c9cf">
            <polygon points="3,6 21,6 12,19" />
          </svg>
        </button>

        {abierto && (
          <ul className={style.menu}>
            {CONTRATOS.map((x, i) => (
              <li key={x.nombre}>
                <button
                  type="button"
                  className={i === contrato ? style.itemActivo : style.item}
                  onClick={() => {
                    setContrato(i);
                    setAbierto(false);
                  }}
                >
                  {x.nombre} · {x.estado}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reporte */}
      <Modal />
    </div>
  );
};

export default Seccion_3;