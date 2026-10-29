import { useState } from "react";
import style from "./seccion_1.module.css";
import Modal from "./shared/modal";

interface Seccion1Props {
  onCreado: () => void;
}

const Seccion_1 = ({ onCreado }: Seccion1Props) => {
  const [showModal, setShowModal] = useState(false);

  const handleGuardado = () => {
    setShowModal(false);
    onCreado();
  };

  return (
    <div className={style.seccion}>
      <div>
        <h2><b>Listado de Roles</b></h2>
        <p>Administra y organiza los roles de tu empresa desde un solo lugar.</p>
      </div>

      <div>
        <button className={style.boton} onClick={() => setShowModal(true)}>
          <span className={style.icono}>⊕</span> Crear Rol
        </button>
      </div>

      {showModal && (
        <Modal
          modo="crear"
          rol={null}
          onClose={() => setShowModal(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  );
};

export default Seccion_1;