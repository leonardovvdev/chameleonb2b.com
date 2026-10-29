import style from "./seccion_1.module.css";
import Modal from "./shared/modal/modal";

const Seccion_1 = () => {
  return (
    <div className={style.seccion}>
      {/* Imagen de fondo (ocupa toda la sección) */}
      <img className={style.fondo} src="./fondoselva.jpg" alt="" />

      {/* Contenedor que centra el modal */}
      <div className={style.login}>
        <Modal />
      </div>
    </div>
  );
};

export default Seccion_1;