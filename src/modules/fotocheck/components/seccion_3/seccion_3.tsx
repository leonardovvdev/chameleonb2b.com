import style from "./seccion_3.module.css";

interface Seccion3Props {
  titulo?: string;
  descripcion?: string;
  actualizado?: string;
  miniatura?: string;
  onEditar?: () => void;
  onVistaPrevia?: () => void;
  onDescargar?: () => void;
}

const Seccion_3 = ({
  titulo = "Fotocheck principal",
  descripcion = "Diseño estándar asignado al usuario.",
  actualizado = "01/10/2026 - 10:42 a. m.",
  miniatura = "",
  onEditar,
  onVistaPrevia,
  onDescargar,
}: Seccion3Props) => {
  return (
    <div className={style.seccion}>
      <p className={style.descripcion}>
        Aquí puedes ver y gestionar todos los fotochecks de este trabajador.
      </p>

      <div className={style.tarjeta}>
        <div className={style.miniatura}>
          {miniatura && <img src={miniatura} alt={titulo} />}
        </div>

        <div className={style.info}>
          <span className={style.badge}>
            <span className={style.check}>✓</span>
            Diseño predeterminado
          </span>
          <h3>{titulo}</h3>
          <p>{descripcion}</p>
          <small>📅 Actualizado: {actualizado}</small>
        </div>

        <div className={style.acciones}>
          <button type="button" className={style.boton} onClick={onEditar}>
            ✏️ Editar
          </button>
          <button type="button" className={style.boton} onClick={onVistaPrevia}>
            👁️ Vista previa
          </button>
          <button type="button" className={style.boton} onClick={onDescargar}>
            ⬇️ Descargar
          </button>
        </div>
      </div>

      <div className={style.vacio}>
        <div className={style.vacioIcono}>🪪</div>
        <h4>Aún no tienes más fotochecks</h4>
        <p>Puedes crear diseños adicionales para este usuario.</p>
      </div>
    </div>
  );
};

export default Seccion_3;