import { useState } from "react";
import style from "./seccion_2.module.css";

type Estado = "a_tiempo" | "tardanza" | "falta";
type Registro = { estado: Estado; hora?: string; refrigerio?: number }; // minutos
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Datos de ejemplo (sin backend): solo Octubre 2026
const MES_ACTUAL = { anio: 2026, mes: 9 };
const ASISTENCIA_OCT_2026: Record<number, Registro> = {
  1: { estado: "falta" },
  2: { estado: "tardanza", hora: "08:35" },
  5: { estado: "a_tiempo", hora: "07:49", refrigerio: 45 },
  6: { estado: "a_tiempo", hora: "07:53", refrigerio: 60 },
  7: { estado: "a_tiempo", hora: "08:00", refrigerio: 52 },
  8: { estado: "a_tiempo", hora: "07:52" },
  9: { estado: "a_tiempo", hora: "07:58" },
  12: { estado: "a_tiempo", hora: "07:57" },
  13: { estado: "a_tiempo", hora: "08:00" },
  14: { estado: "tardanza", hora: "08:35" },
  15: { estado: "a_tiempo", hora: "07:55" },
  16: { estado: "a_tiempo", hora: "07:48" },
  19: { estado: "tardanza", hora: "08:11" },
  20: { estado: "a_tiempo", hora: "07:46" },
  21: { estado: "falta" },
  22: { estado: "a_tiempo", hora: "07:52" },
  23: { estado: "tardanza", hora: "08:10" },
  26: { estado: "a_tiempo", hora: "08:00" },
  27: { estado: "a_tiempo", hora: "07:51" },
  28: { estado: "tardanza", hora: "08:35" },
  29: { estado: "tardanza", hora: "08:27" },
};

const Seccion_2 = () => {
  const [anio, setAnio] = useState(MES_ACTUAL.anio);
  const [mes, setMes] = useState(MES_ACTUAL.mes);

  const esMesActual = anio === MES_ACTUAL.anio && mes === MES_ACTUAL.mes;
  const registros = esMesActual ? ASISTENCIA_OCT_2026 : {};

  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0
  const celdas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const cambiarMes = (delta: number) => {
    const d = new Date(anio, mes + delta, 1);
    setAnio(d.getFullYear());
    setMes(d.getMonth());
  };

  const claseEstado: Record<Estado, string> = {
    a_tiempo: style.aTiempo,
    tardanza: style.tardanza,
    falta: style.falta,
  };

  return (
    <div className={style.seccion}>
      <div className={style.header}>
        <button type="button" className={style.nav} onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className={style.titulo}>
          {MESES[mes]} {anio}
        </h3>
        <button type="button" className={style.nav} onClick={() => cambiarMes(1)} disabled={esMesActual} aria-label="Mes siguiente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className={style.grid}>
        {DIAS.map((d) => (
          <div key={d} className={style.diaSemana}>{d}</div>
        ))}

        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`v${i}`} />;
          const reg = registros[dia];
          return (
            <div
              key={dia}
              className={`${style.dia} ${reg ? claseEstado[reg.estado] : style.vacio}`}
            >
              <span className={style.num}>{dia}</span>
                {reg && (
                  <span className={style.sub}>
                    {reg.estado === "falta" ? "Falta" : reg.hora}
                  </span>
                )}
                {reg?.refrigerio !== undefined && (
                  <span className={style.refrigerio}>{reg.refrigerio} min</span>
                )}
            </div>
          );
        })}
      </div>

      <div className={style.leyenda}>
        <span><i className={`${style.punto} ${style.aTiempo}`} /> A tiempo (08:00 o antes)</span>
        <span><i className={`${style.punto} ${style.tardanza}`} /> Tardanza</span>
        <span><i className={`${style.punto} ${style.falta}`} /> No asistió</span>
      </div>
    </div>
  );
};

export default Seccion_2;
