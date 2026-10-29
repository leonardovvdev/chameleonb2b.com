import { useState } from "react";
import { icon } from "../../../../../core/icons";
import style from "../seccion_3.module.css";

const MESES = ["Agosto", "Septiembre", "Octubre"];

const REPORTE = {
  honorario: 1130,
  ausencia: { total: 2, monto: -37.67 },
  tardanza: {
    minutos: 156,
    monto: -12.24,
    detalle: [
      { fecha: "02/10/2026", valor: "08:35" },
      { fecha: "14/10/2026", valor: "08:35" },
      { fecha: "19/10/2026", valor: "08:11" },
      { fecha: "23/10/2026", valor: "08:10" },
      { fecha: "28/10/2026", valor: "08:35" },
      { fecha: "29/10/2026", valor: "08:27" },
    ],
  },
  demora: {
    minutos: 156,
    monto: -12.24,
    detalle: [
      { fecha: "12/10/2026", valor: "52 min" },
      { fecha: "13/10/2026", valor: "52 min" },
      { fecha: "14/10/2026", valor: "52 min" },
    ],
  },
  incidencias: [
    { fecha: "12/09/2026", monto: -10 },
    { fecha: "13/09/2026", monto: -10 },
    { fecha: "14/09/2026", monto: -5 },
    { fecha: "15/09/2026", monto: -36 },
  ],
  adelantos: [{ fecha: "12/09/2026", monto: -350 }],
  afp: 204.66,
  total: 430,
};

const fmt = (n: number) => n.toFixed(2);

const Modal = () => {
  const [mes, setMes] = useState("Octubre");
  const [verTardanza, setVerTardanza] = useState(false);
  const [verDemora, setVerDemora] = useState(false);

  return (
    <div className={style.reporte}>
      <div className={style.honorario}>
        <span className={style.honorarioLabel}>Honorario</span>
        <span className={style.honorarioValor}>S/. {REPORTE.honorario}</span>
      </div>

      <div className={style.meses}>
        {MESES.map((m) => (
          <button
            key={m}
            type="button"
            className={m === mes ? style.mesActivo : style.mes}
            onClick={() => setMes(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className={style.descuentos}>descuentos:</div>

      {/* Ausencia */}
      <div className={style.bloque}>
        <div className={style.bloqueHead}>
          <span className={style.bloqueTitulo}>Ausencia:</span>
          <span className={style.colMonto}>Monto</span>
        </div>
        <div className={style.fila}>
          <span>TOTAL: {REPORTE.ausencia.total}</span>
          <span className={style.neg}>{fmt(REPORTE.ausencia.monto)}</span>
        </div>
      </div>

      {/* Tardanza */}
      <div className={style.bloque}>
        <div className={style.bloqueHead}>
            <span className={style.bloqueTitulo}>
            Tardanza
            <button
                type="button"
                className={style.iconBtn}
                onClick={() => setVerTardanza((v) => !v)}
            >
                <icon.iconArrowDown className={style.icon} />
            </button>
            </span>
          <span className={style.colMonto}>Monto</span>
        </div>
        <div className={style.fila}>
          <span>TOTAL: {REPORTE.tardanza.minutos} mnts</span>
          <span className={style.neg}>{fmt(REPORTE.tardanza.monto)}</span>
        </div>
        {verTardanza &&
          REPORTE.tardanza.detalle.map((d) => (
            <div key={d.fecha} className={style.detalle}>
              <span>{d.fecha}</span>
              <span>{d.valor}</span>
            </div>
          ))}
      </div>

      {/* Demora */}
      <div className={style.bloque}>
        <div className={style.bloqueHead}>
            <span className={style.bloqueTitulo}>
            Demora
            <button
                type="button"
                className={style.iconBtn}
                onClick={() => setVerDemora((v) => !v)}
            >
                <icon.iconArrowDown className={style.icon} />
            </button>
            </span>
          <span className={style.colMonto}>Monto</span>
        </div>
        <div className={style.fila}>
          <span>TOTAL: {REPORTE.demora.minutos} mnts</span>
          <span className={style.neg}>{fmt(REPORTE.demora.monto)}</span>
        </div>
        {verDemora &&
          REPORTE.demora.detalle.map((d) => (
            <div key={d.fecha} className={style.detalle}>
              <span>{d.fecha}</span>
              <span>{d.valor}</span>
            </div>
          ))}
      </div>

      {/* Incidencias */}
      <div className={style.bloque}>
        <div className={style.bloqueHead}>
          <span className={style.bloqueTitulo}>Incidencias</span>
          <span className={style.colMonto}>Monto</span>
        </div>
        {REPORTE.incidencias.map((i) => (
          <div key={i.fecha} className={style.fila}>
            <span>{i.fecha}</span>
            <span className={style.neg}>{i.monto}</span>
          </div>
        ))}
      </div>

      {/* Adelantos */}
      <div className={style.bloque}>
        <div className={style.bloqueHead}>
          <span className={style.bloqueTitulo}>Adelantos</span>
          <span className={style.colMonto}>Monto</span>
        </div>
        {REPORTE.adelantos.map((a) => (
          <div key={a.fecha} className={style.fila}>
            <span>{a.fecha}</span>
            <span className={style.neg}>{a.monto}</span>
          </div>
        ))}
      </div>

      {/* AFP */}
      <div className={style.afp}>
        <span>AFP</span>
        <span className={style.neg}>{REPORTE.afp}</span>
      </div>

      <div className={style.total}>
        <span>TOTAL:</span>
        <span>S/. {REPORTE.total}</span>
      </div>
    </div>
  );
};

export default Modal;