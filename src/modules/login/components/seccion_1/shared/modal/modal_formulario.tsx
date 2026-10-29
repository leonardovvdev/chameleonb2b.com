import style from "./modal.module.css";

interface ModalFormularioProps {
  /** Vuelve a la vista de login. */
  onYaTengoCuenta: () => void;
}

/**
 * Vista de registro: ya no tiene inputs.
 * La cuenta solo se crea con Google (botón que pone el componente Modal);
 * el correo y la contraseña los define el customer después, dentro del sistema.
 */
const ModalFormulario = ({ onYaTengoCuenta }: ModalFormularioProps) => {
  return (
    <div className={style.formulario}>
      <p className={style.label}>
        Crea tu cuenta con Google. Luego podrás definir tu correo y contraseña dentro del sistema.
      </p>

      <button type="button" className={style.enlace} onClick={onYaTengoCuenta}>
        ya tengo cuenta
      </button>
    </div>
  );
};

export default ModalFormulario;