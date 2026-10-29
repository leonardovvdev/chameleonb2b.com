import { useEffect, useState } from "react";
import style from "./list.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import type { StaffFilters } from "../../../core/types";
import { FILTROS_STAFF_INICIALES } from "../controllers/list.controller";
import { prefetchDefaultFotocheck } from "../../../core/services/fotocheck.service";

export default function StaffPage() {
  const [filtros, setFiltros] = useState<StaffFilters>(FILTROS_STAFF_INICIALES);

  // Trae el fotocheck (y sus imágenes) en segundo plano: "Ver fotocheck" abre al instante.
  useEffect(() => {
    void prefetchDefaultFotocheck();
  }, []);

  const actualizarFiltros = (cambios: Partial<StaffFilters>) =>
    setFiltros((prev) => ({ ...prev, ...cambios }));

  return (
    <div className={style.page}>
      <Seccion_1 />
      <Seccion_2 filtros={filtros} onChange={actualizarFiltros} />
      <Seccion_3 filtros={filtros} />
    </div>
  );
}