import type { RegistroDetalle, StaffAttendance } from "../../../../types/register.types";
import style from "./modal_information.module.css";

const Campo = ({ etiqueta, valor }: { etiqueta: string; valor: string | null }) => (
  <div className={style.campo}>
    <span className={style.etiqueta}>{etiqueta}</span>
    <span className={style.valor}>{valor || "—"}</span>
  </div>
);

interface ModalInformationProps {
  registro: StaffAttendance;
  /** null mientras carga (o si falló). */
  detalle: RegistroDetalle | null;
  cargando: boolean;
  error: string;
}

const ModalInformation = ({ registro, detalle, cargando, error }: ModalInformationProps) => {
  const iniciales = `${registro.stff_name[0] ?? ""}${registro.stff_lastname[0] ?? ""}`.toUpperCase();

  return (
    <div className={style.contenedor}>
      <div className={style.perfil}>
        {registro.img_url ? (
          <img src={registro.img_url} alt={registro.stff_name} className={style.foto} />
        ) : (
          <div className={style.fotoVacia}>{iniciales}</div>
        )}
        <div className={style.perfilTexto}>
          <span className={style.nombreCompleto}>
            {registro.stff_name} {registro.stff_lastname}
          </span>
          <span className={style.cargoPerfil}>{registro.job_position_name ?? "Sin cargo"}</span>
        </div>
      </div>

      <div className={style.grilla}>
        <Campo etiqueta="Nombre" valor={registro.stff_name} />
        <Campo etiqueta="Apellido" valor={registro.stff_lastname} />
        <Campo etiqueta="DNI" valor={registro.stff_dni} />
        <Campo etiqueta="Cargo" valor={registro.job_position_name} />
        <Campo etiqueta="Rol" valor={cargando && !detalle ? "Cargando…" : (detalle?.role_name ?? null)} />
      </div>

      {error && !detalle && (
        <p role="alert" style={{ margin: 0, color: "#b42318", fontSize: 13 }}>
          {error}
        </p>
      )}

      <div className={style.total}>
        <span className={style.totalNumero}>{detalle ? detalle.total_records : "—"}</span>
        <span className={style.totalTexto}>
          registros de asistencia en total
          <small>Suma de todas las fechas en la tabla attendance</small>
        </span>
      </div>
    </div>
  );
};

export default ModalInformation;