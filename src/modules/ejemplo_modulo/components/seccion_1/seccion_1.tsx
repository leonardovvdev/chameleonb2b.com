import style from "./seccion_1.module.css";
import { icon } from "../../../../core/icons";

const iconos = Object.entries(icon);

const Seccion_1 = () => {
  return (
    <div className={style.seccion}>
      <h2>Galería de iconos</h2>

      <div className={style.galeria}>
        {iconos.map(([nombre, Icono]) => (
          <div className={style.icono} key={nombre}>
            <Icono />
            <span>{nombre}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Seccion_1;