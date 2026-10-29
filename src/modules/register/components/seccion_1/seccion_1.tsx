import style from "./seccion_1.module.css";

/** Encabezado de la página. El botón "Nuevo Registro" está en seccion_3, junto a los filtros. */
const Seccion_1 = () => {
  return (
    <div className={style.seccion}>
      <div>
        <h2><b>Registro de Asistencia</b></h2>
        <p>Monitorea las entradas, salidas, horas trabajadas y tardanzas de los colaboradores en tiempo real.</p>
      </div>
    </div>
  );
};

export default Seccion_1;