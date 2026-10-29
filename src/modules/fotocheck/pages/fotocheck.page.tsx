import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import style from "./fotocheck.page.module.css";

export default function FotocheckPage() {
  return (
    <div className={style.pagina}>
      <Seccion_1 />

      <div className={style.fila}>
        <Seccion_2 />
        <Seccion_3 />
      </div>
    </div>
  );
}