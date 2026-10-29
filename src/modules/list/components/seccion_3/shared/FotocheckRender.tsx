import type { CSSProperties, ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import type {
  FotocheckBackground,
  FotocheckConfig,
  FotocheckElement,
  FotocheckVariables,
} from "../../../../../core/types/fotocheck.types";
import { getFotocheckImageUrl } from "../../../../../core/services/fotocheck.service";

// El editor trabaja en px: 5.4 cm x 60 = 324 px de ancho.
const PX_POR_CM = 60;

interface FotocheckRenderProps {
  config: FotocheckConfig;
  variables: FotocheckVariables;
  /** URL de la foto del trabajador (variable "staff.photo"). */
  fotoUrl: string | null;
  /** Se muestra dentro del recuadro de foto cuando no hay foto. */
  fotoVacia?: ReactNode;
  /** Alto máximo en px; el fotocheck se reduce/amplía para caber. */
  alturaMaxima?: number;
}

const reemplazarVariables = (
  texto: string,
  variables: FotocheckVariables
): string =>
  texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, clave: string) =>
    variables[clave] ?? ""
  );

// Mismo contenido y color que el generador de QR de asistencia.
const COLOR_QR = "#0D47A1";

const construirDatosQr = (variables: FotocheckVariables): string =>
  JSON.stringify({
    nombre: (variables["staff.name"] ?? "").trim().toUpperCase(),
    apellido: (variables["staff.lastname"] ?? "").trim().toUpperCase(),
    dni: (variables["staff.dni"] ?? "").trim(),
    cargo: (variables["staff.job_position"] ?? "").trim().toUpperCase(),
  });

const estiloFondo = (fondo: FotocheckBackground): CSSProperties => ({
  position: "absolute",
  inset: 0,
  opacity: fondo.opacity ?? 1,
  background:
    fondo.type === "gradient"
      ? `linear-gradient(${fondo.gradient.angle}deg, ${fondo.gradient.from}, ${fondo.gradient.to})`
      : fondo.color,
});

const estiloBase = (el: FotocheckElement): CSSProperties => ({
  position: "absolute",
  left: el.x,
  top: el.y,
  width: el.width,
  height: el.height,
  opacity: el.opacity ?? 1,
  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
  boxSizing: "border-box",
});

const renderElemento = (
  el: FotocheckElement,
  variables: FotocheckVariables,
  fotoUrl: string | null,
  fotoVacia: ReactNode
) => {
  if (el.hidden) return null;

  switch (el.type) {
    case "rect":
      return (
        <div
          key={el.id}
          style={{
            ...estiloBase(el),
            background: el.fill,
            border: el.strokeWidth
              ? `${el.strokeWidth}px solid ${el.stroke}`
              : undefined,
            borderRadius: el.borderRadius,
          }}
        />
      );

    case "line":
      return (
        <div key={el.id} style={{ ...estiloBase(el), background: el.fill }} />
      );

    case "text":
      return (
        <div
          key={el.id}
          style={{
            ...estiloBase(el),
            color: el.color,
            fontSize: el.fontSize,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            textAlign: el.textAlign,
            lineHeight: 1.2,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {reemplazarVariables(el.content, variables)}
        </div>
      );

    case "image": {
      // El backend manda `url` firmada para el bucket privado del customer.
      // Si no viene, se intenta la URL pública (solo sirve en buckets públicos).
      const url = el.url ?? getFotocheckImageUrl(el.bucket, el.path);
      if (!url) return null;
      return (
        <img
          key={el.id}
          src={url}
          alt={el.name}
          draggable={false}
          onError={(e) => {
            e.currentTarget.style.display = "none"; // evita el icono de imagen rota
          }}
          style={{ ...estiloBase(el), objectFit: el.fit }}
        />
      );
    }

    case "photo": {
      const cajaFoto: CSSProperties = {
        ...estiloBase(el),
        border: el.strokeWidth
          ? `${el.strokeWidth}px solid ${el.stroke}`
          : undefined,
        borderRadius: el.borderRadius,
        overflow: "hidden",
        background: "#e5e7eb",
      };
      return (
        <div key={el.id} style={cajaFoto}>
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={el.name}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: el.fit }}
            />
          ) : (
            fotoVacia ?? null
          )}
        </div>
      );
    }

    // El elemento "referencial" es el espacio reservado para el QR del personal.
    case "referencial": {
      const lado = Math.min(el.width, el.height);
      return (
        <div
          key={el.id}
          style={{
            ...estiloBase(el),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFFFF",
          }}
        >
          <QRCodeSVG
            value={construirDatosQr(variables)}
            size={lado}
            level="M"
            fgColor={COLOR_QR}
            bgColor="#FFFFFF"
            marginSize={1}
          />
        </div>
      );
    }

    default:
      return null;
  }
};

const FotocheckRender = ({
  config,
  variables,
  fotoUrl,
  fotoVacia,
  alturaMaxima,
}: FotocheckRenderProps) => {
  const ancho = config.canvas.widthCm * PX_POR_CM;
  const alto = config.canvas.heightCm * PX_POR_CM;
  const escala = alturaMaxima ? Math.min(1.5, alturaMaxima / alto) : 1;

  return (
    // Caja externa con el tamaño ya escalado
    <div
      style={{
        width: ancho * escala,
        height: alto * escala,
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        userSelect: "none",
      }}
    >
      {/* Lienzo real en px del editor; se escala con transform */}
      <div
        style={{
          width: ancho,
          height: alto,
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden", // recorta lo que se sale del lienzo (ej. logos grandes)
          transformOrigin: "top left",
          transform: `scale(${escala})`,
        }}
      >
        <div style={estiloFondo(config.canvas.background)} />
        {config.elements.map((el) =>
          renderElemento(el, variables, fotoUrl, fotoVacia)
        )}
      </div>
    </div>
  );
};

export default FotocheckRender;