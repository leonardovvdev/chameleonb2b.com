import { useState } from "react";
import style from "./seccion_2.module.css";
import ModalLogueo from "../seccion_1/shared/modal/modal_logueo";
import ModalFormulario from "../seccion_1/shared/modal/modal_formulario";

const Seccion_2 = () => {
  const [showRegistro, setShowRegistro] = useState(false);

  return (
    <div className={style.seccion}>
      {!showRegistro ? (
        <ModalLogueo onCrearCuenta={() => setShowRegistro(true)} />
      ) : (
        <ModalFormulario onYaTengoCuenta={() => setShowRegistro(false)} />
      )}
    </div>
  );
};

export default Seccion_2;