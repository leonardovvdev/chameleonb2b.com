import { useState } from "react";
import style from "./role.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import {
  FILTROS_ROLE_INICIALES,
  type RoleFilters,
} from "../controllers/role.controller";

export default function RolePage() {
  const [filtros, setFiltros] = useState<RoleFilters>(FILTROS_ROLE_INICIALES);
  // Sube cada vez que seccion_1 crea un rol, para que la tabla recargue
  const [recargaKey, setRecargaKey] = useState(0);

  const actualizarFiltros = (cambios: Partial<RoleFilters>) =>
    setFiltros((prev) => ({ ...prev, ...cambios }));

  return (
    <div className={style.page}>
      <Seccion_1 onCreado={() => setRecargaKey((k) => k + 1)} />
      <Seccion_2 filtros={filtros} onChange={actualizarFiltros} />
      <Seccion_3 filtros={filtros} recargaKey={recargaKey} />
    </div>
  );
}