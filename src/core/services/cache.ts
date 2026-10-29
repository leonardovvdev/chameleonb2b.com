/**
 * Caché de respuestas del backend para que las pantallas se vean casi al instante.
 *  - Memoria: respuesta inmediata mientras la app esté abierta.
 *  - sessionStorage (opcional): sobrevive a recargar la pestaña; se borra al cerrarla.
 *  - Peticiones en curso compartidas: dos pantallas que piden lo mismo hacen UNA sola consulta.
 *  - Se vacía sola al cerrar sesión o al entrar otro usuario (ver `bindCacheToUser`).
 */

interface Entrada<T> {
  valor: T;
  expiraEn: number;
}

interface Opciones<T> {
  /** Cuánto tiempo la respuesta se considera vigente. */
  ttlMs: number;
  /** Guardarla también en sessionStorage (para que sobreviva a F5). Por defecto: sí. */
  persistir?: boolean;
  /** TTL distinto según el valor (ej. más corto cuando la respuesta es `null`). */
  ttlSegunValor?: (valor: T) => number;
}

const PREFIJO = "aw_cache:";
const memoria = new Map<string, Entrada<unknown>>();
const enCurso = new Map<string, Promise<unknown>>();
let usuarioActual: string | null = null;

const leerStorage = <T>(clave: string): Entrada<T> | null => {
  try {
    const raw = sessionStorage.getItem(PREFIJO + clave);
    return raw ? (JSON.parse(raw) as Entrada<T>) : null;
  } catch {
    return null; // storage no disponible o dato corrupto: se ignora
  }
};

const guardarStorage = (clave: string, entrada: Entrada<unknown>) => {
  try {
    sessionStorage.setItem(PREFIJO + clave, JSON.stringify(entrada));
  } catch {
    /* cuota llena o modo privado: la caché en memoria sigue funcionando */
  }
};

/** Valor vigente guardado (memoria o sessionStorage), o undefined si no hay / venció. */
export function leerCache<T>(clave: string): T | undefined {
  const ahora = Date.now();

  const enMemoria = memoria.get(clave) as Entrada<T> | undefined;
  if (enMemoria && enMemoria.expiraEn > ahora) return enMemoria.valor;

  const enStorage = leerStorage<T>(clave);
  if (enStorage && enStorage.expiraEn > ahora) {
    memoria.set(clave, enStorage);
    return enStorage.valor;
  }
  return undefined;
}

/** Devuelve la respuesta guardada si sigue vigente; si no, ejecuta `consulta` y la guarda. */
export async function conCache<T>(
  clave: string,
  consulta: () => Promise<T>,
  { ttlMs, persistir = true, ttlSegunValor }: Opciones<T>,
): Promise<T> {
  const guardado = leerCache<T>(clave);
  if (guardado !== undefined) return guardado;

  const pendiente = enCurso.get(clave) as Promise<T> | undefined;
  if (pendiente) return pendiente;

  const promesa = consulta()
    .then((valor) => {
      const entrada: Entrada<T> = {
        valor,
        expiraEn: Date.now() + (ttlSegunValor ? ttlSegunValor(valor) : ttlMs),
      };
      memoria.set(clave, entrada);
      if (persistir) guardarStorage(clave, entrada);
      return valor;
    })
    .finally(() => enCurso.delete(clave));

  enCurso.set(clave, promesa);
  return promesa;
}

/** Borra las entradas cuya clave empieza con `prefijo` (tras crear / editar datos). */
export function invalidarCache(prefijo: string): void {
  for (const clave of [...memoria.keys()]) {
    if (clave.startsWith(prefijo)) memoria.delete(clave);
  }
  for (const clave of [...enCurso.keys()]) {
    if (clave.startsWith(prefijo)) enCurso.delete(clave);
  }
  try {
    for (const clave of Object.keys(sessionStorage)) {
      if (clave.startsWith(PREFIJO + prefijo)) sessionStorage.removeItem(clave);
    }
  } catch {
    /* ignorar */
  }
}

/** Vacía toda la caché. */
export const limpiarCache = (): void => invalidarCache("");

/**
 * Liga la caché al usuario de la sesión: si cambia (o se cierra sesión) se vacía,
 * así nunca se muestran datos de otra cuenta.
 */
export function bindCacheToUser(userId: string | null): void {
  if (userId === usuarioActual) return;
  const habiaUsuario = usuarioActual !== null;
  usuarioActual = userId;
  // Primera vez con sesión (ej. F5): se conserva lo de sessionStorage, que es de este mismo usuario.
  if (habiaUsuario || userId === null) limpiarCache();
}