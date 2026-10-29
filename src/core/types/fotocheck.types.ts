// core/types/fotocheck.types.ts

/** Fila de la tabla `fotochecks`. */
export interface Fotocheck {
  fotocheck_id: number;
  fotocheck_name: string;
  fotocheck_description: string | null;
  fotocheck_config: FotocheckConfig;
  /** Parte posterior; `{}` si todavía no tiene diseño (usa `tieneDiseno` para comprobarlo). */
  fotocheck_config_back: Partial<FotocheckConfig> | null;
  fotocheck_preview: string | null;
  fotocheck_preview_back: string | null;
  fotocheck_active: boolean;
  is_default: boolean;
  cust_id: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Contenido de `fotocheck_config` (JSONB)
// ---------------------------------------------------------------------------
export interface FotocheckBackground {
  type: "solid" | "gradient";
  color: string;
  opacity: number;
  gradient: { from: string; to: string; angle: number };
}

export interface FotocheckCanvas {
  widthCm: number;
  heightCm: number;
  background: FotocheckBackground;
}

interface ElementoBase {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hidden: boolean;
  locked: boolean;
  opacity: number;
  rotation: number;
}

export interface FotocheckRect extends ElementoBase {
  type: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface FotocheckLine extends ElementoBase {
  type: "line";
  fill: string;
}

export interface FotocheckPhoto extends ElementoBase {
  type: "photo";
  /** Ej: "staff.photo" */
  variable: string;
  fit: "cover" | "contain" | "fill";
  keepRatio: boolean;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface FotocheckImage extends ElementoBase {
  type: "image";
  bucket: string;
  path: string;
  url?: string | null;
  fit: "cover" | "contain" | "fill";
  keepRatio: boolean;
}

export interface FotocheckText extends ElementoBase {
  type: "text";
  /** Puede incluir variables: "{{staff.name}}" */
  content: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  textAlign: "left" | "center" | "right";
}

/** Espacio reservado para el QR del personal. */
export interface FotocheckReferencial extends ElementoBase {
  type: "referencial";
}

export type FotocheckElement =
  | FotocheckRect
  | FotocheckLine
  | FotocheckPhoto
  | FotocheckImage
  | FotocheckText
  | FotocheckReferencial;

export interface FotocheckConfig {
  version: number;
  canvas: FotocheckCanvas;
  elements: FotocheckElement[];
}

/** `true` si la configuración tiene un diseño que se puede dibujar. */
export const tieneDiseno = (
  config: Partial<FotocheckConfig> | null | undefined
): config is FotocheckConfig =>
  !!config && !!config.canvas && Array.isArray(config.elements);

/** Variables disponibles dentro de los textos: {{staff.name}}, etc. */
export type FotocheckVariables = Record<string, string>;