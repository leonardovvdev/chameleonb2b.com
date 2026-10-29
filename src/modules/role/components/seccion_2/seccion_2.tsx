import { icon } from "../../../../core/icons/";
import type { RoleFilters } from "../../controllers/role.controller";
import style from "./seccion_2.module.css";

interface Seccion2Props {
  filtros: RoleFilters;
  onChange: (cambios: Partial<RoleFilters>) => void;
}

const Seccion_2 = ({ filtros, onChange }: Seccion2Props) => {
  return (
    <section className={style.seccion}>
      <div className={style.busqueda}>
        <div className={style.searchWrapper} role="search">
          <icon.iconMagnifyingGlass className={style.iconLupa} />
          <input
            type="search"
            placeholder="Buscar por nombre o descripción"
            aria-label="Buscar rol"
            value={filtros.busqueda}
            onChange={(e) => onChange({ busqueda: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
};

export default Seccion_2;