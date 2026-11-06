import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import style from "./seccion_2.module.css";
import ModalListaPersonal from "./modal/modal";
import type { SeccionLista, VarianteModal } from "./modal/modal";
import type { ListasResumen, RegisterSummary } from "../../types/register.types";
import { icon } from "../../../../core/icons";

/* ───────── Utilidades ───────── */
/** Porcentaje sobre el total de empleados: "66.7%". */
const porcentaje = (valor: number, total: number): string =>
  total > 0 ? `${((valor / total) * 100).toFixed(1)}%` : "0%";

type CardId = "empleados" | "puntuales" | "tardanzas" | "ausencias";

/* ───────── Componente ───────── */
interface Seccion2Props {
  resumen: RegisterSummary;
  /** Listas de personal que muestra el modal de cada card. */
  listas: ListasResumen;
  /** true = la fecha consultada es hoy (agrega "hoy" a las etiquetas). */
  esHoy: boolean;
  cargando: boolean;
}

const Seccion_2 = ({ resumen, listas, esHoy, cargando }: Seccion2Props) => {
  const { totalEmpleados, puntuales, tardanzas, ausencias } = resumen;
  const sufijo = esHoy ? " hoy" : "";
  const [abierto, setAbierto] = useState<CardId | null>(null);

  /** Props comunes para que cada card sea clicable y accesible por teclado. */
  const clicable = (id: CardId) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => {
      if (!cargando) setAbierto(id);
    },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!cargando) setAbierto(id);
      }
    },
  });

  /** Configuración del modal según el card abierto. */
  const modal: {
    titulo: string;
    icono: ReactNode;
    variante: VarianteModal;
    secciones: SeccionLista[];
  } | null = (() => {
    switch (abierto) {
      case "empleados":
        return {
          titulo: "Total de empleados",
          icono: <icon.iconUsers />,
          variante: "azul",
          secciones: [{ personas: listas.empleados, vacio: "No hay personal activo." }],
        };
      case "puntuales":
        return {
          titulo: `Puntuales${sufijo}`,
          icono: <icon.iconCheck />,
          variante: "verde",
          secciones: [{ personas: listas.puntuales, vacio: "Nadie llegó puntual." }],
        };
      case "tardanzas":
        return {
          titulo: `Tardanzas${sufijo}`,
          icono: <icon.iconClock />,
          variante: "naranja",
          secciones: [
            {
              titulo: "Tardanza de ingreso",
              personas: listas.tardanzaIngreso,
              vacio: "Nadie llegó tarde.",
            },
            {
              titulo: "Tardanza de refrigerio",
              personas: listas.tardanzaRefrigerio,
              vacio: "Nadie se pasó del refrigerio.",
            },
          ],
        };
      case "ausencias":
        return {
          titulo: `Ausencias${sufijo}`,
          icono: <icon.iconClose />,
          variante: "rojo",
          secciones: [
            { personas: listas.ausentes, vacio: "Todo el personal marcó su ingreso." },
          ],
        };
      default:
        return null;
    }
  })();

  return (
    <div className={style.seccion}>
      {/* ───── Card 1: Total de empleados ───── */}
      <div className={style.card1} {...clicable("empleados")}>
        <span className={style.iconoCaja}>
          <icon.iconUsers className={style.icon} />
        </span>
        <div className={style.textos}>
          <p className={style.valor}>{cargando ? "—" : totalEmpleados}</p>
          <p className={style.etiqueta}>Total de empleados</p>
        </div>
      </div>

      {/* ───── Card 2: Puntuales ───── */}
      <div className={style.card2} {...clicable("puntuales")}>
        <span className={style.iconoCaja}>
          <icon.iconCheck className={style.icon} />
        </span>
        <div className={style.textos}>
          <p className={style.valor}>{cargando ? "—" : puntuales}</p>
          <p className={style.etiqueta}>{`Puntuales${sufijo}`}</p>
        </div>
        <span className={style.porcentaje}>
          {cargando ? "" : porcentaje(puntuales, totalEmpleados)}
        </span>
      </div>

      {/* ───── Card 3: Tardanzas ───── */}
      <div className={style.card3} {...clicable("tardanzas")}>
        <span className={style.iconoCaja}>
          <icon.iconClock className={style.icon} />
        </span>
        <div className={style.textos}>
          <p className={style.valor}>{cargando ? "—" : tardanzas}</p>
          <p className={style.etiqueta}>{`Tardanzas${sufijo}`}</p>
        </div>
        <span className={style.porcentaje}>
          {cargando ? "" : porcentaje(tardanzas, totalEmpleados)}
        </span>
      </div>

      {/* ───── Card 4: Ausencias ───── */}
      <div className={style.card4} {...clicable("ausencias")}>
        <span className={style.iconoCaja}>
          <icon.iconClose className={style.icon} />
        </span>
        <div className={style.textos}>
          <p className={style.valor}>{cargando ? "—" : ausencias}</p>
          <p className={style.etiqueta}>{`Ausencias${sufijo}`}</p>
        </div>
        <span className={style.porcentaje}>
          {cargando ? "" : porcentaje(ausencias, totalEmpleados)}
        </span>
      </div>

      {modal && (
        <ModalListaPersonal
          titulo={modal.titulo}
          icono={modal.icono}
          variante={modal.variante}
          secciones={modal.secciones}
          onClose={() => setAbierto(null)}
        />
      )}
    </div>
  );
};

export default Seccion_2;