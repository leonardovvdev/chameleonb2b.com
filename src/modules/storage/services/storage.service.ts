import { callBackend } from "../../../core/services";

export interface Carpeta {
  name: string;
  /** true = carpeta del sistema (no se elimina ni cuenta para el máximo). */
  system: boolean;
  files: number;
  subfolders: number;
}

export interface Limites {
  maxFolders: number;
  maxFilesPerFolder: number;
  maxVideoBytes: number;
}

export interface ListadoCarpetas {
  items: Carpeta[];
  limits: Limites;
  /** Carpetas creadas por el usuario (las del sistema no cuentan). */
  userFolders: number;
}

export interface Archivo {
  name: string;
  path: string;
  kind: "image" | "video";
  size: number | null;
  /** Enlace firmado y temporal (el bucket es privado). */
  url: string | null;
}

export interface ContenidoCarpeta {
  folder: string;
  subfolders: string[];
  files: Archivo[];
}

/** Todas las carpetas de primer nivel del bucket. */
export const listarCarpetas = (): Promise<ListadoCarpetas> =>
  callBackend<ListadoCarpetas>("storage/folders");

/** Máximo 5 carpetas creadas por el usuario. No se crean subcarpetas. */
export const crearCarpeta = (nombre: string): Promise<Carpeta> =>
  callBackend<Carpeta>("storage/folders", { method: "POST", query: { name: nombre } });

export const eliminarCarpeta = (nombre: string) =>
  callBackend<{ name: string }>("storage/folders", { method: "DELETE", query: { name: nombre } });

export const listarArchivos = (carpeta: string): Promise<ContenidoCarpeta> =>
  callBackend<ContenidoCarpeta>("storage/files", { query: { folder: carpeta } });

/** Imagen (se convierte a WebP) o video de hasta 5 MB. Máximo 10 archivos por carpeta. */
export const subirArchivo = (carpeta: string, archivo: File): Promise<Archivo> => {
  const form = new FormData();
  form.append("folder", carpeta);
  form.append("file", archivo);
  return callBackend<Archivo>("storage/files", { method: "POST", body: form });
};

export const eliminarArchivo = (carpeta: string, nombre: string) =>
  callBackend<{ name: string }>("storage/files", {
    method: "DELETE",
    query: { folder: carpeta, name: nombre },
  });