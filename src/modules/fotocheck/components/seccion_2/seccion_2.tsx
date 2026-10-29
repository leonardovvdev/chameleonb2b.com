import style from "./seccion_2.module.css";

interface FotocheckProps {
  nombre?: string;
  rol?: string;
  dni?: string;
  empresa?: string;
  foto?: string;
}

const Seccion_2 = ({
  nombre = "David Jhunior",
  rol = "Administrador",
  dni = "12345678",
  empresa = "System AW",
  foto = "",
}: FotocheckProps) => {
  return (
    <div className={style.seccion}>
      <div className={style.encabezado}>
        <p>Vista previa</p>
        
      </div>

      <div className={style.fotocheck}>
        <div className={style.logo}>
          <span className={style.logoIcono} />
          <span>TU EMPRESA</span>
        </div>

        <div className={style.fotoWrapper}>
          {foto ? <img src={foto} alt={nombre} /> : <div className={style.fotoVacia} />}
        </div>

        <h3 className={style.nombre}>{nombre}</h3>
        <span className={style.rol}>{rol}</span>

        <div className={style.dato}>
          <span className={style.datoIcono}>👤</span>
          <div>
            <small>DNI</small>
            <strong>{dni}</strong>
          </div>
        </div>

        {/* Reemplaza por <QRCodeSVG value={dni} size={96} /> de "qrcode.react" */}
        <div className={style.qr} />

        <div className={style.dato}>
          <span className={style.datoIcono}>🏢</span>
          <div>
            <small>Empresa</small>
            <strong>{empresa}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Seccion_2;