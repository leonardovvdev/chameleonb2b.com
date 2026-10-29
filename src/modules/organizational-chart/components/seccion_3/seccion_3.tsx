import { useLayoutEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import style from "./seccion_3.module.css";
import { useOrganizationalChartController } from "../../controllers/Organizational-chart.controller";
import type { OrgNode } from "../../types/organizational-chart.types";

// Escala mínima para que el texto siga siendo legible.
// Si el organigrama no cabe ni así, el lienzo hace scroll horizontal.
const MIN_ESCALA = 0.6;

// Logo: coloca tu archivo en la carpeta /public con este nombre
// (o cambia la ruta / URL aquí).
const LOGO_SRC = "/logogorrioncito.png";

// =========================================================
// TARJETA DE UNA PERSONA
// =========================================================

interface TarjetaProps {
  nodo: OrgNode;
  esRaiz: boolean;
}

const TarjetaPersona = ({ nodo, esRaiz }: TarjetaProps) => {
  const tieneHijos = nodo.hijos.length > 0;

  const clases = [
    style.tarjeta,
    tieneHijos ? style.conHijos : "",
    esRaiz ? style.raiz : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases}>
      {nodo.img_url ? (
        <img
          src={nodo.img_url}
          alt={`${nodo.name} ${nodo.lastname}`}
          className={style.avatar}
        />
      ) : (
        <span className={style.avatarPlaceholder}>
          {nodo.name.charAt(0).toUpperCase()}
        </span>
      )}

      <div className={style.textos}>
        <p className={style.nombre}>
          {nodo.name} {nodo.lastname}
        </p>
        <p className={style.cargo}>
          {nodo.job_position ?? "Sin cargo"}
        </p>
      </div>
    </div>
  );
};

// =========================================================
// NODO DEL ORGANIGRAMA
// Si todos los hijos son "hojas" (sin equipo a cargo) y hay más de uno,
// se apilan en vertical para ahorrar ancho.
// =========================================================

interface NodoOrganigramaProps {
  nodo: OrgNode;
  esRaiz?: boolean;
}

const NodoOrganigrama = ({ nodo, esRaiz = false }: NodoOrganigramaProps) => {
  const tieneHijos = nodo.hijos.length > 0;
  const apilar =
    nodo.hijos.length > 1 && nodo.hijos.every((h) => h.hijos.length === 0);

  return (
    <div className={`${style.rama} ${apilar ? style.ramaApilada : ""}`}>
      <TarjetaPersona nodo={nodo} esRaiz={esRaiz} />

      {tieneHijos &&
        (apilar ? (
          <div className={style.hijosApilados}>
            {nodo.hijos.map((hijo) => (
              <div key={hijo.id} className={style.itemApilado}>
                <TarjetaPersona nodo={hijo} esRaiz={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className={style.hijos}>
            {nodo.hijos.map((hijo) => (
              <NodoOrganigrama key={hijo.id} nodo={hijo} />
            ))}
          </div>
        ))}
    </div>
  );
};

// =========================================================
// SECCIÓN 3
// =========================================================

const Seccion_3 = () => {
  const { arbol, cargando, mensajeError } = useOrganizationalChartController();
  const [errorPdf, setErrorPdf] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const vistaRef = useRef<HTMLDivElement>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [tamano, setTamano] = useState({ ancho: 0, alto: 0 });

  const loading = cargando;
  const error = mensajeError ?? errorPdf;

  // =========================================================
  // AJUSTE AL ANCHO DISPONIBLE
  // =========================================================

  useLayoutEffect(() => {
    const vista = vistaRef.current;
    const contenido = contenidoRef.current;
    if (!vista || !contenido) return;

    const ajustar = () => {
      const anchoNat = contenido.offsetWidth;
      const altoNat = contenido.offsetHeight;
      if (!anchoNat || !altoNat) return;

      const anchoDisp = vista.clientWidth;

      setTamano({ ancho: anchoNat, alto: altoNat });
      setEscala(Math.max(MIN_ESCALA, Math.min(1, anchoDisp / anchoNat)));
    };

    ajustar();

    const observer = new ResizeObserver(ajustar);
    observer.observe(vista);
    observer.observe(contenido);
    window.addEventListener("resize", ajustar);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", ajustar);
    };
  }, [arbol, loading, error]);

  // =========================================================
  // DESCARGAR PDF
  // Solo la lámina (logo + organigrama), sin texto adicional.
  // La orientación se elige según la forma del organigrama.
  // =========================================================

const descargarPdf = async () => {
  const contenido = contenidoRef.current;
  if (!contenido) return;

  setGenerandoPdf(true);

  try {
    // Proporción exacta de A4 horizontal
    const RATIO_A4 = 297 / 210;

    const anchoNat = contenido.offsetWidth;
    const altoNat = contenido.offsetHeight;

    // Se agranda la lámina (nunca se recorta) hasta tener proporción A4
    let anchoObj = anchoNat;
    let altoObj = altoNat;
    if (anchoNat / altoNat < RATIO_A4) {
      anchoObj = altoNat * RATIO_A4;
    } else {
      altoObj = anchoNat / RATIO_A4;
    }

    const escalaCaptura = Math.min(2, 8000 / Math.max(anchoObj, altoObj));

    const canvas = await html2canvas(contenido, {
      scale: escalaCaptura,
      backgroundColor: "#ffffff",
      useCORS: true,
      width: anchoObj,
      height: altoObj,
      onclone: (_doc, el) => {
        const escalaEl = el.parentElement;
        const cajaEl = escalaEl?.parentElement;
        if (escalaEl) escalaEl.style.transform = "none";
        if (cajaEl) {
          cajaEl.style.width = "auto";
          cajaEl.style.height = "auto";
        }
        // La copia que se captura tiene proporción A4 y esquinas rectas
        el.style.width = `${anchoObj}px`;
        el.style.height = `${altoObj}px`;
        el.style.borderRadius = "0";
      },
    });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // La imagen ocupa toda la hoja, sin márgenes
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
    pdf.save("organigrama.pdf");
  } catch (err) {
    console.error("ERROR AL GENERAR PDF DEL ORGANIGRAMA:", err);
    setErrorPdf("No se pudo generar el PDF.");
  } finally {
    setGenerandoPdf(false);
  }
};

  if (loading) {
    return (
      <div className={style.seccion}>
        <p className={style.estado}>Cargando organigrama...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={style.seccion}>
        <p className={`${style.estado} ${style.error}`}>{error}</p>
      </div>
    );
  }

  return (
    <div className={style.seccion}>
      <div className={style.encabezado}>
        <h2 className={style.titulo}></h2>

        {arbol.length > 0 && (
          <button
            type="button"
            className={style.botonPdf}
            onClick={descargarPdf}
            disabled={generandoPdf}
          >
            {generandoPdf ? "Generando PDF..." : "Descargar PDF"}
          </button>
        )}
      </div>

      {arbol.length === 0 ? (
        <p className={style.estado}>
          Aún no hay personal registrado para este cliente.
        </p>
      ) : (
        <div ref={vistaRef} className={style.lienzo}>
          <div
            className={style.caja}
            style={{ width: tamano.ancho * escala, height: tamano.alto * escala }}
          >
            <div
              className={style.escala}
              style={{ transform: `scale(${escala})` }}
            >
              <div ref={contenidoRef} className={style.contenido}>
                {/* Logo arriba a la izquierda */}
                <div className={style.cabeceraLogo}>
                  <img
                    src={LOGO_SRC}
                    alt="Logo"
                    className={style.logo}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                {/* Organigrama */}
                <div className={style.arbol}>
                  {arbol.map((raiz) => (
                    <NodoOrganigrama key={raiz.id} nodo={raiz} esRaiz />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seccion_3;