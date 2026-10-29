import { useEffect, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import style from "./modal_information.module.css";
import FotocheckRender from "./FotocheckRender";
import ModalEditar from "./modal_editar";
import {
  getDefaultFotocheck,
  getFotocheckImageUrl,
} from "../../../../../core/services/fotocheck.service";
import {
  tieneDiseno,
  type Fotocheck,
  type FotocheckConfig,
  type FotocheckElement,
  type FotocheckVariables,
} from "../../../../../core/types/fotocheck.types";
import type { StaffListItem } from "../../../../../core/types";

/* ───────────────────────── Exportar el fotocheck a PNG ─────────────────────────
 * Se dibuja directo en un <canvas> con los mismos datos que FotocheckRender
 * (sin librerías extra). El QR usa el mismo contenido y color que el render. */
const PX_POR_CM = 60; // igual que FotocheckRender
const ESCALA_EXPORT = 3; // 324 px de ancho en pantalla → 972 px en el PNG
const COLOR_QR = "#0D47A1";

const construirVariables = (staff: StaffListItem): FotocheckVariables => {
  const nombreCompleto = `${staff.stff_name} ${staff.stff_lastname}`;
  return {
    "staff.name": staff.stff_name,
    "staff.lastname": staff.stff_lastname,
    "staff.fullname": nombreCompleto,
    "staff.full_name": nombreCompleto,
    "staff.dni": staff.stff_dni,
    "staff.phone": staff.stff_phone ?? "",
    "staff.job_position": staff.job_position_name ?? "",
    "staff.role": staff.role_name ?? "",
  };
};

const reemplazarVariables = (texto: string, variables: FotocheckVariables) =>
  texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, clave: string) => variables[clave] ?? "");

const cargarImagen = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // sin esto el canvas se "contamina" y no se puede exportar
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const construirImagenQr = async (variables: FotocheckVariables, lado: number) => {
  const datos = JSON.stringify({
    nombre: (variables["staff.name"] ?? "").trim().toUpperCase(),
    apellido: (variables["staff.lastname"] ?? "").trim().toUpperCase(),
    dni: (variables["staff.dni"] ?? "").trim(),
    cargo: (variables["staff.job_position"] ?? "").trim().toUpperCase(),
  });

  let svg = renderToStaticMarkup(
    <QRCodeSVG
      value={datos}
      size={Math.round(lado * ESCALA_EXPORT)}
      level="M"
      fgColor={COLOR_QR}
      bgColor="#FFFFFF"
      marginSize={1}
    />
  );
  if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const img = await cargarImagen(url);
  URL.revokeObjectURL(url);
  return img;
};

const trazarRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radio: number
) => {
  const r = Math.max(0, Math.min(radio, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const dibujarAjustada = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  fit: "cover" | "contain" | "fill"
) => {
  if (fit === "fill") {
    ctx.drawImage(img, 0, 0, w, h);
    return;
  }
  const escala =
    fit === "cover"
      ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
      : Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * escala;
  const dh = img.naturalHeight * escala;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
};

const envolverTexto = (ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] => {
  const lineas: string[] = [];

  texto.split("\n").forEach((parrafo) => {
    let actual = "";
    parrafo.split(" ").forEach((palabra) => {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width <= ancho) {
        actual = prueba;
        return;
      }
      if (actual) lineas.push(actual);
      actual = "";

      // Palabra más ancha que la caja: se parte por caracteres (overflow-wrap: anywhere)
      let resto = palabra;
      while (ctx.measureText(resto).width > ancho && resto.length > 1) {
        let corte = resto.length - 1;
        while (corte > 1 && ctx.measureText(resto.slice(0, corte)).width > ancho) corte--;
        lineas.push(resto.slice(0, corte));
        resto = resto.slice(corte);
      }
      actual = resto;
    });
    lineas.push(actual);
  });

  return lineas;
};

const dibujarElemento = async (
  ctx: CanvasRenderingContext2D,
  el: FotocheckElement,
  variables: FotocheckVariables,
  fotoUrl: string | null
) => {
  if (el.hidden) return;

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  // Misma transformación que el CSS: rotación alrededor del centro
  ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
  if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.translate(-el.width / 2, -el.height / 2);

  const { width: w, height: h } = el;

  switch (el.type) {
    case "rect": {
      trazarRect(ctx, 0, 0, w, h, el.borderRadius);
      ctx.fillStyle = el.fill;
      ctx.fill();
      if (el.strokeWidth) {
        const m = el.strokeWidth / 2; // el borde CSS queda dentro de la caja
        trazarRect(ctx, m, m, w - el.strokeWidth, h - el.strokeWidth, el.borderRadius - m);
        ctx.lineWidth = el.strokeWidth;
        ctx.strokeStyle = el.stroke;
        ctx.stroke();
      }
      break;
    }

    case "line":
      ctx.fillStyle = el.fill;
      ctx.fillRect(0, 0, w, h);
      break;

    case "text": {
      const fuente = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
      const texto = reemplazarVariables(el.content, variables);
      await document.fonts?.load(fuente, texto).catch(() => undefined);

      ctx.font = fuente;
      ctx.fillStyle = el.color;
      ctx.textBaseline = "middle";
      ctx.textAlign = el.textAlign;

      const interlineado = el.fontSize * 1.2; // mismo line-height que FotocheckRender
      const x = el.textAlign === "center" ? w / 2 : el.textAlign === "right" ? w : 0;
      envolverTexto(ctx, texto, w).forEach((linea, i) =>
        ctx.fillText(linea, x, i * interlineado + interlineado / 2)
      );
      break;
    }

    case "image": {
      const url = el.url ?? getFotocheckImageUrl(el.bucket, el.path);
      const img = url ? await cargarImagen(url) : null;
      if (img) dibujarAjustada(ctx, img, w, h, el.fit);
      break;
    }

    case "photo": {
      trazarRect(ctx, 0, 0, w, h, el.borderRadius);
      ctx.fillStyle = "#e5e7eb";
      ctx.fill();

      const img = fotoUrl ? await cargarImagen(fotoUrl) : null;
      if (img) {
        ctx.save();
        trazarRect(ctx, 0, 0, w, h, el.borderRadius);
        ctx.clip();
        dibujarAjustada(ctx, img, w, h, el.fit);
        ctx.restore();
      }
      if (el.strokeWidth) {
        const m = el.strokeWidth / 2;
        trazarRect(ctx, m, m, w - el.strokeWidth, h - el.strokeWidth, el.borderRadius - m);
        ctx.lineWidth = el.strokeWidth;
        ctx.strokeStyle = el.stroke;
        ctx.stroke();
      }
      break;
    }

    case "referencial": {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      const lado = Math.min(w, h);
      const qr = await construirImagenQr(variables, lado);
      if (qr) ctx.drawImage(qr, (w - lado) / 2, (h - lado) / 2, lado, lado);
      break;
    }
  }

  ctx.restore();
};

const generarImagen = async (
  config: FotocheckConfig,
  variables: FotocheckVariables,
  fotoUrl: string | null
): Promise<Blob> => {
  await document.fonts?.ready;

  const ancho = config.canvas.widthCm * PX_POR_CM;
  const alto = config.canvas.heightCm * PX_POR_CM;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(ancho * ESCALA_EXPORT);
  canvas.height = Math.round(alto * ESCALA_EXPORT);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen.");
  ctx.scale(ESCALA_EXPORT, ESCALA_EXPORT);

  // Base blanca (el fondo del diseño puede tener opacidad)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, ancho, alto);

  // Fondo: sólido o degradado (mismo ángulo que linear-gradient de CSS)
  const fondo = config.canvas.background;
  ctx.save();
  ctx.globalAlpha = fondo.opacity ?? 1;
  if (fondo.type === "gradient") {
    const rad = (fondo.gradient.angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const mitad = (Math.abs(ancho * dx) + Math.abs(alto * dy)) / 2;
    const degradado = ctx.createLinearGradient(
      ancho / 2 - dx * mitad,
      alto / 2 - dy * mitad,
      ancho / 2 + dx * mitad,
      alto / 2 + dy * mitad
    );
    degradado.addColorStop(0, fondo.gradient.from);
    degradado.addColorStop(1, fondo.gradient.to);
    ctx.fillStyle = degradado;
  } else {
    ctx.fillStyle = fondo.color;
  }
  ctx.fillRect(0, 0, ancho, alto);
  ctx.restore();

  // Recorta lo que se sale del lienzo (igual que overflow: hidden)
  ctx.beginPath();
  ctx.rect(0, 0, ancho, alto);
  ctx.clip();

  for (const el of config.elements) {
    await dibujarElemento(ctx, el, variables, fotoUrl);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen."))),
      "image/png"
    )
  );
};

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ───────────────────────── Modal ───────────────────────── */

interface ArchivosFotocheck {
  frente: File;
  reverso: File | null;
}

export type PestanaPersonal = "ver" | "editar";

interface ModalInformationProps {
  staff: StaffListItem;
  tabInicial?: PestanaPersonal;
  onClose: () => void;
  /** Datos nuevos del personal tras editarlo o cambiar su foto. */
  onActualizado: (cambios: Partial<StaffListItem>) => void;
}

const ALTURA_FOTOCHECK = 380;

const ModalInformation = ({
  staff,
  tabInicial = "ver",
  onClose,
  onActualizado,
}: ModalInformationProps) => {
  const [tab, setTab] = useState<PestanaPersonal>(tabInicial);
  const [lado, setLado] = useState<"frente" | "reverso">("frente");

  // undefined = cargando · null = el cliente no tiene fotocheck predeterminado
  const [fotocheck, setFotocheck] = useState<Fotocheck | null | undefined>(undefined);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [archivos, setArchivos] = useState<ArchivosFotocheck | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const nombreCompleto = `${staff.stff_name} ${staff.stff_lastname}`;
  const hayReverso = !!fotocheck && tieneDiseno(fotocheck.fotocheck_config_back);

  // Fotocheck con is_default = true
  useEffect(() => {
    let activo = true;
    getDefaultFotocheck()
      .then((f) => activo && setFotocheck(f))
      .catch((err) => {
        console.error("Error al cargar el fotocheck:", err);
        if (activo) {
          setErrorCarga("No se pudo cargar el fotocheck.");
          setFotocheck(null);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  // Las imágenes se generan por adelantado: así WhatsApp y Descargar responden al instante
  // (compartir archivos exige que se llame justo después del clic).
  useEffect(() => {
    if (!fotocheck) return;
    let activo = true;
    setArchivos(null);

    const variables = construirVariables(staff);
    const base = `fotocheck-${staff.stff_dni}`;

    (async () => {
      try {
        const frente = await generarImagen(fotocheck.fotocheck_config, variables, staff.img_url);
        const back = fotocheck.fotocheck_config_back;
        const reverso = tieneDiseno(back) ? await generarImagen(back, variables, staff.img_url) : null;
        if (!activo) return;

        setArchivos({
          frente: new File([frente], `${base}-frente.png`, { type: "image/png" }),
          reverso: reverso ? new File([reverso], `${base}-reverso.png`, { type: "image/png" }) : null,
        });
      } catch (err) {
        console.error("Error al generar las imágenes del fotocheck:", err);
        if (activo) setAviso("No se pudieron preparar las imágenes del fotocheck.");
      }
    })();

    return () => {
      activo = false;
    };
    // Se regenera solo si cambia algo que se ve en el fotocheck
  }, [
    fotocheck,
    staff.stff_name,
    staff.stff_lastname,
    staff.stff_dni,
    staff.stff_phone,
    staff.job_position_name,
    staff.role_name,
    staff.img_url,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const listaArchivos = (): File[] =>
    archivos ? [archivos.frente, ...(archivos.reverso ? [archivos.reverso] : [])] : [];

  /** Descarga el frente y el reverso. */
  const descargar = async () => {
    const archivosADescargar = listaArchivos();
    if (archivosADescargar.length === 0) return;

    setOcupado(true);
    setAviso(null);
    for (const archivo of archivosADescargar) {
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = archivo.name;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      await esperar(400); // el navegador pide permiso para varias descargas seguidas
    }
    setOcupado(false);
  };

  /**
   * Abre el menú de compartir del dispositivo con las 2 imágenes ya adjuntas;
   * ahí se elige WhatsApp y el contacto. Un enlace de WhatsApp no puede adjuntar
   * archivos, por eso, si el navegador no permite compartir archivos, se
   * descargan las imágenes y se abre WhatsApp para adjuntarlas.
   */
  const enviarPorWhatsapp = async () => {
    const files = listaArchivos();
    if (files.length === 0) return;
    setAviso(null);

    if (navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, title: "Fotocheck", text: `Fotocheck de ${nombreCompleto}` });
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error al compartir el fotocheck:", err);
          setAviso("No se pudo abrir el menú de compartir.");
        }
      }
      return;
    }

    await descargar();
    // Los teléfonos del sistema tienen 9 dígitos (Perú, +51)
    const telefono = staff.stff_phone ? `51${staff.stff_phone}` : "";
    const mensaje = encodeURIComponent(`Hola ${staff.stff_name}, te envío tu fotocheck.`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, "_blank", "noopener");
    setAviso(
      "Este navegador no puede adjuntar imágenes por sí solo: se descargaron las imágenes, adjúntalas en la conversación de WhatsApp."
    );
  };

  const configVisible: FotocheckConfig | null =
    !fotocheck
      ? null
      : lado === "reverso" && tieneDiseno(fotocheck.fotocheck_config_back)
        ? fotocheck.fotocheck_config_back
        : fotocheck.fotocheck_config;

  return (
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={style.modal} role="dialog" aria-modal="true" aria-label={`Personal: ${nombreCompleto}`}>
        <div className={style.encabezado}>
          <div>
            <h3 className={style.titulo}>{nombreCompleto}</h3>
            <p className={style.subtitulo}>
              {staff.job_position_name || "Sin cargo"} · DNI {staff.stff_dni}
            </p>
          </div>
          <button type="button" className={style.cerrar} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className={style.pestanas} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "ver"}
            className={`${style.pestana} ${tab === "ver" ? style.pestanaActiva : ""}`}
            onClick={() => setTab("ver")}
          >
            Ver fotocheck
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "editar"}
            className={`${style.pestana} ${tab === "editar" ? style.pestanaActiva : ""}`}
            onClick={() => setTab("editar")}
          >
            Editar
          </button>
        </div>

        <div className={style.contenido}>
          {tab === "ver" ? (
            <div className={style.ver}>
              {/* ── Izquierda: el fotocheck en un cuadro ── */}
              <div className={style.cuadro}>
                {fotocheck === undefined ? (
                  <p className={style.mensaje}>Cargando fotocheck...</p>
                ) : configVisible ? (
                  <>
                    {hayReverso && (
                      <button
                        type="button"
                        className={style.girar}
                        onClick={() => setLado((l) => (l === "frente" ? "reverso" : "frente"))}
                        aria-label={lado === "frente" ? "Ver la parte de atrás" : "Ver la parte frontal"}
                        title={lado === "frente" ? "Ver la parte de atrás" : "Ver la parte frontal"}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      </button>
                    )}

                    <div key={lado} className={style.fotocheck}>
                      <FotocheckRender
                        config={configVisible}
                        variables={construirVariables(staff)}
                        fotoUrl={staff.img_url}
                        alturaMaxima={ALTURA_FOTOCHECK}
                      />
                    </div>
                    <span className={style.etiquetaLado}>
                      {lado === "frente" ? "Parte frontal" : "Parte de atrás"}
                    </span>
                  </>
                ) : (
                  <p className={style.mensaje}>
                    {errorCarga ??
                      "No hay un fotocheck predeterminado. Marca uno como predeterminado para verlo aquí."}
                  </p>
                )}
              </div>

              {/* ── Derecha: acciones ── */}
              <div className={style.acciones}>
                <h4 className={style.accionesTitulo}>Compartir fotocheck</h4>
                <p className={style.accionesTexto}>
                  {hayReverso
                    ? "Se envían y se descargan las 2 imágenes: frente y atrás."
                    : "Este fotocheck solo tiene parte frontal."}
                </p>

                <button
                  type="button"
                  className={style.botonWhatsapp}
                  onClick={enviarPorWhatsapp}
                  disabled={!archivos || ocupado}
                >
                  Enviar por WhatsApp
                </button>
                <button
                  type="button"
                  className={style.botonDescargar}
                  onClick={descargar}
                  disabled={!archivos || ocupado}
                >
                  {ocupado ? "Descargando..." : "Descargar"}
                </button>

                {fotocheck && !archivos && !aviso && (
                  <p className={style.nota}>Preparando imágenes...</p>
                )}
                {aviso && <p className={style.nota}>{aviso}</p>}
              </div>
            </div>
          ) : (
            <ModalEditar
              staff={staff}
              onActualizado={onActualizado}
              onCancelar={() => setTab("ver")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalInformation;
