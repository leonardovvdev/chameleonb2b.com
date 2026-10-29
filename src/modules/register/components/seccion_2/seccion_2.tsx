import type { ReactNode } from "react";
import style from "./seccion_2.module.css";
import type { RegisterSummary } from "../../types/register.types";

/* ───────── Iconos (SVG propios) ───────── */
const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    className={style.icono}
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

const IconoEmpleados = () => (
  <Svg>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M18 14c1.7.6 3 2.1 3 4.5" />
  </Svg>
);

const IconoPresente = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.8 2.8L16 9.5" />
  </Svg>
);

const IconoTardanza = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

const IconoAusencia = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Svg>
);

interface Seccion2Props {
  resumen: RegisterSummary;
  /** true = la fecha consultada es hoy (cambia "hoy" en las etiquetas). */
  esHoy: boolean;
  cargando: boolean;
}

/** Porcentaje sobre el total de empleados: "66.7%". */
const porcentaje = (valor: number, total: number): string =>
  total > 0 ? `${((valor / total) * 100).toFixed(1)}%` : "0%";

const Seccion_2 = ({ resumen, esHoy, cargando }: Seccion2Props) => {
  const { totalEmpleados, presentes, tardanzas, ausencias } = resumen;
  const sufijo = esHoy ? " hoy" : "";

  const tarjetas: {
    Icono: () => ReactNode;
    tono: string;
    valor: number;
    etiqueta: string;
    extra: string | null;
  }[] = [
    { Icono: IconoEmpleados, tono: style.azul, valor: totalEmpleados, etiqueta: "Total de empleados", extra: null },
    { Icono: IconoPresente, tono: style.verde, valor: presentes, etiqueta: `Presentes${sufijo}`, extra: porcentaje(presentes, totalEmpleados) },
    { Icono: IconoTardanza, tono: style.naranja, valor: tardanzas, etiqueta: `Tardanzas${sufijo}`, extra: porcentaje(tardanzas, totalEmpleados) },
    { Icono: IconoAusencia, tono: style.rojo, valor: ausencias, etiqueta: `Ausencias${sufijo}`, extra: porcentaje(ausencias, totalEmpleados) },
  ];

  return (
    <div className={style.seccion}>
      {tarjetas.map(({ Icono, tono, valor, etiqueta, extra }) => (
        <article key={etiqueta} className={style.tarjeta}>
          <span className={`${style.iconoCaja} ${tono}`}>
            <Icono />
          </span>

          <div className={style.textos}>
            <p className={style.valor}>{cargando ? "—" : valor}</p>
            <p className={style.etiqueta}>{etiqueta}</p>
          </div>

          {extra !== null && <span className={style.porcentaje}>{cargando ? "" : extra}</span>}
        </article>
      ))}
    </div>
  );
};

export default Seccion_2;