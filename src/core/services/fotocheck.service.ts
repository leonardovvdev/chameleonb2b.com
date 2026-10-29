import { supabase } from "../../lib/supabase";
import { callBackend } from "./backend";
import { conCache, invalidarCache } from "./cache";
import type { Fotocheck } from "../types/fotocheck.types";

const CLAVE_DEFAULT = "fotocheck:default";
/** Menor que la vigencia de los enlaces firmados del backend (1 hora). */
const TTL_FOTOCHECK_MS = 10 * 60_000;
/** Si aún no hay predeterminado se vuelve a preguntar pronto (puede marcarlo en otra pantalla). */
const TTL_SIN_FOTOCHECK_MS = 30_000;

/** Fotocheck predeterminado del customer (null si no tiene). El customer sale del JWT. */
export const getDefaultFotocheck = (): Promise<Fotocheck | null> =>
  conCache(
    CLAVE_DEFAULT,
    () => callBackend<{ fotocheck: Fotocheck | null }>("fotochecks/default").then((r) => r.fotocheck),
    {
      ttlMs: TTL_FOTOCHECK_MS,
      ttlSegunValor: (f) => (f ? TTL_FOTOCHECK_MS : TTL_SIN_FOTOCHECK_MS),
    },
  );

/** Llamar tras crear, editar o marcar otro fotocheck como predeterminado. */
export const invalidateDefaultFotocheck = (): void => invalidarCache(CLAVE_DEFAULT);

/* ───────────────────────── Precarga ───────────────────────── */

const imagenesPrecargadas = new Map<string, HTMLImageElement>();

const precargarImagen = (url: string) => {
  if (imagenesPrecargadas.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.onerror = () => imagenesPrecargadas.delete(url); // permite reintentar
  img.src = url;
  imagenesPrecargadas.set(url, img);
};

/**
 * Pide el fotocheck predeterminado y descarga sus imágenes (logos, fondos…) en segundo plano.
 * Llámalo al abrir la lista: cuando el usuario abra "Ver fotocheck" ya estará todo listo.
 * Nunca lanza error.
 */
export const prefetchDefaultFotocheck = async (): Promise<void> => {
  try {
    const fotocheck = await getDefaultFotocheck();
    if (!fotocheck) return;

    for (const config of [fotocheck.fotocheck_config, fotocheck.fotocheck_config_back]) {
      for (const el of config?.elements ?? []) {
        if (el.type === "image" && el.url) precargarImagen(el.url);
      }
    }
  } catch (err) {
    console.warn("No se pudo precargar el fotocheck:", err);
  }
};

/** Solo para imágenes de un bucket público; las del bucket del customer traen `url` firmada. */
export const getFotocheckImageUrl = (bucket: string, path: string): string | null => {
  if (!bucket || !path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};