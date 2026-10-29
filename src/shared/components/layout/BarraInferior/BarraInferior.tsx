import style from "./BarraInferior.module.css";

const BarraInferior = () => {
  return (
    <footer className={style.footer}>
      <div className={style.contenido}>
        {/* Columna 1: Logo + descripcion + redes */}
        <div className={style.columna}>
          <div className={style.logo}>
            <span className={style.logoIcono}>S</span>
            <span className={style.logoTexto}>SYSTEM AW</span>
          </div>
          <p className={style.descripcion}>
            Soluciones inteligentes que impulsan la productividad y el
            crecimiento de tu empresa.
          </p>
          <p className={style.eslogan}>
            Tecnología. Automatización. Resultados.
          </p>
          <div className={style.redes}>
            <a href="#" aria-label="LinkedIn" className={style.redIcono}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
              </svg>
            </a>
            <a href="#" aria-label="GitHub" className={style.redIcono}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className={style.redIcono}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M23.5 6.5s-.23-1.64-.94-2.36c-.9-.94-1.9-.95-2.36-1C17 2.8 12 2.8 12 2.8h-.01s-5 0-8.19.34c-.46.05-1.47.06-2.36 1C.73 4.86.5 6.5.5 6.5S.25 8.42.25 10.35v1.79c0 1.93.25 3.85.25 3.85s.23 1.64.94 2.36c.9.95 2.08.92 2.6 1.02C5.9 19.53 12 19.6 12 19.6s5.01-.01 8.2-.35c.46-.06 1.47-.06 2.36-1.01.71-.72.94-2.36.94-2.36s.25-1.93.25-3.85v-1.8c0-1.93-.25-3.84-.25-3.84zM9.75 13.98V7.98l6 3-6 3z" />
              </svg>
            </a>
            <a href="#" aria-label="Correo" className={style.redIcono}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 6l10 7 10-7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Productos */}
        <div className={style.columna}>
          <h3 className={style.titulo}>PRODUCTOS</h3>
          <ul className={style.lista}>
            <li><a href="#">Módulos</a></li>
            <li><a href="#">Funcionalidades</a></li>
            <li><a href="#">Integraciones</a></li>
            <li><a href="#">Precios</a></li>
            <li><a href="#">Actualizaciones</a></li>
            <li><a href="#">Roadmap</a></li>
          </ul>
        </div>

        {/* Columna 3: Empresa */}
        <div className={style.columna}>
          <h3 className={style.titulo}>EMPRESA</h3>
          <ul className={style.lista}>
            <li><a href="#">Nosotros</a></li>
            <li><a href="#">Misión y Visión</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Casos de éxito</a></li>
            <li><a href="#">Trabaja con nosotros</a></li>
          </ul>
        </div>

        {/* Columna 4: Soporte */}
        <div className={style.columna}>
          <h3 className={style.titulo}>SOPORTE</h3>
          <ul className={style.lista}>
            <li><a href="#">Centro de ayuda</a></li>
            <li><a href="#">Documentación</a></li>
            <li><a href="#">Soporte técnico</a></li>
            <li><a href="#">Preguntas frecuentes</a></li>
            <li><a href="#">Estado del sistema</a></li>
          </ul>
        </div>

        {/* Columna 5: Contactanos */}
        <div className={style.columna}>
          <h3 className={style.titulo}>CONTÁCTANOS</h3>
          <ul className={style.listaContacto}>
            <li>Perú</li>
            <li>hola@systemaw.com</li>
            <li>+51 987 654 321</li>
            <li>Lun - Vie: 8:00 a.m. - 6:00 p.m.</li>
            <li>Sáb: 8:00 a.m. - 12:00 p.m.</li>
          </ul>
        </div>
      </div>

      {/* Linea divisoria */}
      <div className={style.divisor} />

      {/* Barra inferior */}
      <div className={style.barraFinal}>
        <div className={style.seguridad}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="24" height="24">
            <path d="M12 2 L20 5.5 V11.5 C20 16.5 16.5 20.2 12 22 C7.5 20.2 4 16.5 4 11.5 V5.5 Z" />
            <path d="M9 12 L11 14 L15 9.5" />
          </svg>
          <p>
            Tu información está segura con nosotros.
            <br />
            Cumplimos con los más altos estándares de seguridad y privacidad.
          </p>
        </div>

        <p className={style.copyright}>
          © 2025 System AW. Todos los derechos reservados.{" "}
          <a href="#">Política de privacidad</a> | <a href="#">Términos y condiciones</a>
        </p>

        <div className={style.pagos}>
          <span className={style.pagosLabel}>Métodos de pago:</span>
          <span className={style.tarjeta}>VISA</span>
          <span className={style.tarjeta}>MASTERCARD</span>
          <span className={style.tarjeta}>AMEX</span>
          <span className={style.tarjeta}>PAYPAL</span>
        </div>
      </div>
    </footer>
  );
};

export default BarraInferior;