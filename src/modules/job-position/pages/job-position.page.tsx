import { useState } from "react";
import style from "./job-position.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import {
  FILTROS_JOBPOSITION_INICIALES,
  type JobPositionFilters,
} from "../controllers/job-position.controller";

export default function JobPositionPage() {
  const [filtros, setFiltros] = useState<JobPositionFilters>(
    FILTROS_JOBPOSITION_INICIALES
  );
  // Sube cada vez que seccion_1 crea un cargo, para que la tabla recargue
  const [recargaKey, setRecargaKey] = useState(0);

  const actualizarFiltros = (cambios: Partial<JobPositionFilters>) =>
    setFiltros((prev) => ({ ...prev, ...cambios }));

  return (
    <div className={style.page}>
      <Seccion_1 onCreado={() => setRecargaKey((k) => k + 1)} />
      <Seccion_2 filtros={filtros} onChange={actualizarFiltros} />
      <Seccion_3 filtros={filtros} recargaKey={recargaKey} />
    </div>
  );
}