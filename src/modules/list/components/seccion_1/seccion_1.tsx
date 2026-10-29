import { useState } from "react";
import style from "./seccion_1.module.css";
import Modal from "./shared/modal";

const Seccion_1 = () => {
  const [showModal, setShowModal] = useState(false);

  const cerrarModal = () => setShowModal(false);

  return (
    <div className={style.seccion}>
      <div>
        <h2>Lista de Personal</h2>
        <p>
          Administra y organiza la información de tu personal, cargos, roles y estado laboral de
          manera centralizada.
        </p>
      </div>

      <div>
        <button className={style.boton} onClick={() => setShowModal(true)}>
          <span className={style.icono}>⊕</span> Nuevo Registro
        </button>
      </div>

      {showModal && <Modal onClose={cerrarModal} onGuardado={cerrarModal} />}
    </div>
  );
};

export default Seccion_1;