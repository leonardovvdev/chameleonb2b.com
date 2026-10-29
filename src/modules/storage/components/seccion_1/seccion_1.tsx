import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../../core/contexts/auth.context";
import {
  listarCarpetas,
  crearCarpeta,
  eliminarCarpeta,
  listarArchivos,
  subirArchivo,
  eliminarArchivo,
  type Carpeta,
  type ContenidoCarpeta,
  type Limites,
} from "../../services/storage.service";
import style from "./seccion_1.module.css";

const LIMITES_POR_DEFECTO: Limites = {
  maxFolders: 5,
  maxFilesPerFolder: 10,
  maxVideoBytes: 5 * 1024 * 1024,
};

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const FORMATOS = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime";

const mensajeDe = (err: unknown, porDefecto: string) =>
  err instanceof Error && err.message ? err.message : porDefecto;

const IconoCarpeta = () => (
  <svg className={style.iconoCarpeta} viewBox="0 0 64 52" aria-hidden="true">
    <path
      d="M4 8a4 4 0 0 1 4-4h14.2a4 4 0 0 1 3 1.35L30 10h26a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"
      fill="#c99a2e"
    />
    <path
      d="M4 18a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V18Z"
      fill="#e3b341"
    />
  </svg>
);

const Seccion_1 = () => {
  const { custId, loadingAuth } = useAuth();

  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [limites, setLimites] = useState<Limites>(LIMITES_POR_DEFECTO);
  const [creadas, setCreadas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);

  const [abierta, setAbierta] = useState<string | null>(null);
  const [contenido, setContenido] = useState<ContenidoCarpeta | null>(null);
  const [cargandoContenido, setCargandoContenido] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const cargarCarpetas = useCallback(async () => {
    setError(null);
    try {
      const r = await listarCarpetas();
      setCarpetas(r.items);
      setLimites(r.limits);
      setCreadas(r.userFolders);
    } catch (err) {
      console.error("Error al obtener carpetas:", err);
      setError(mensajeDe(err, "No se pudieron cargar las carpetas."));
      setCarpetas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarContenido = useCallback(async (carpeta: string) => {
    setCargandoContenido(true);
    setError(null);
    try {
      setContenido(await listarArchivos(carpeta));
    } catch (err) {
      console.error("Error al obtener archivos:", err);
      setError(mensajeDe(err, "No se pudieron cargar los archivos."));
      setContenido(null);
    } finally {
      setCargandoContenido(false);
    }
  }, []);

  useEffect(() => {
    if (loadingAuth) return;
    if (custId) {
      void cargarCarpetas();
    } else {
      setLoading(false);
    }
  }, [custId, loadingAuth, cargarCarpetas]);

  const abrirCarpeta = (nombre: string) => {
    setAbierta(nombre);
    setContenido(null);
    void cargarContenido(nombre);
  };

  const volver = () => {
    setAbierta(null);
    setContenido(null);
    setError(null);
    void cargarCarpetas();
  };

  const handleCrear = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      setError("Escribe un nombre para la carpeta.");
      return;
    }
    setCreando(true);
    setError(null);
    try {
      await crearCarpeta(nombre);
      setNuevoNombre("");
      await cargarCarpetas();
    } catch (err) {
      console.error("Error al crear carpeta:", err);
      setError(mensajeDe(err, "No se pudo crear la carpeta."));
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarCarpeta = async (nombre: string) => {
    if (!confirm(`¿Eliminar la carpeta "${nombre}" y todo su contenido?`)) return;
    setError(null);
    try {
      await eliminarCarpeta(nombre);
      await cargarCarpetas();
    } catch (err) {
      console.error("Error al eliminar carpeta:", err);
      setError(mensajeDe(err, "No se pudo eliminar la carpeta."));
    }
  };

  const handleSubir = async (archivo: File | null) => {
    if (!archivo || !abierta) return;

    const esVideo = archivo.type.startsWith("video/");
    if (esVideo && archivo.size > limites.maxVideoBytes) {
      setError("El video no puede pesar más de 5 MB.");
      return;
    }
    if (!esVideo && archivo.size > MAX_IMAGEN_BYTES) {
      setError("La imagen no puede pesar más de 5 MB.");
      return;
    }
    if ((contenido?.files.length ?? 0) >= limites.maxFilesPerFolder) {
      setError(`Cada carpeta admite como máximo ${limites.maxFilesPerFolder} imágenes o videos.`);
      return;
    }

    setSubiendo(true);
    setError(null);
    try {
      await subirArchivo(abierta, archivo);
      await cargarContenido(abierta);
    } catch (err) {
      console.error("Error al subir archivo:", err);
      setError(mensajeDe(err, "No se pudo subir el archivo."));
    } finally {
      setSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  };

  const handleEliminarArchivo = async (nombre: string) => {
    if (!abierta || !confirm("¿Eliminar este archivo?")) return;
    setError(null);
    try {
      await eliminarArchivo(abierta, nombre);
      await cargarContenido(abierta);
    } catch (err) {
      console.error("Error al eliminar archivo:", err);
      setError(mensajeDe(err, "No se pudo eliminar el archivo."));
    }
  };

  if (loadingAuth || loading) {
    return (
      <div className={style.seccion}>
        <p className={style.mensaje}>Cargando...</p>
      </div>
    );
  }

  if (!custId) {
    return (
      <div className={style.seccion}>
        <p className={style.mensaje}>No se encontró el cust_id del usuario.</p>
      </div>
    );
  }

  /* ───────────── Vista: contenido de una carpeta ───────────── */
  if (abierta) {
    const archivos = contenido?.files ?? [];
    const lleno = archivos.length >= limites.maxFilesPerFolder;

    return (
      <div className={style.seccion}>
        <div className={style.cabecera}>
          <div className={style.ruta}>
            <button className={style.enlace} onClick={volver}>
              Storage
            </button>
            <span className={style.separador}>/</span>
            <span className={style.rutaActual}>{abierta}</span>
          </div>

          <div className={style.acciones}>
            <span className={style.contador}>
              {archivos.length} / {limites.maxFilesPerFolder} archivos
            </span>
            <input
              ref={inputArchivo}
              type="file"
              accept={FORMATOS}
              className={style.inputOculto}
              onChange={(e) => void handleSubir(e.target.files?.[0] ?? null)}
            />
            <button
              className={style.botonPrimario}
              disabled={subiendo || lleno}
              onClick={() => inputArchivo.current?.click()}
            >
              {subiendo ? "Subiendo..." : "Subir archivo"}
            </button>
          </div>
        </div>

        <p className={style.ayuda}>
          Imágenes o videos (JPG, PNG, WEBP, GIF, MP4, WEBM, MOV). Máximo {limites.maxFilesPerFolder}{" "}
          archivos por carpeta y videos de hasta 5 MB.
        </p>

        {error && <p className={style.error}>{error}</p>}

        {cargandoContenido ? (
          <p className={style.mensaje}>Cargando...</p>
        ) : (
          <>
            {contenido && contenido.subfolders.length > 0 && (
              <div className={style.subcarpetas}>
                Contiene subcarpetas del sistema: {contenido.subfolders.join(", ")}
              </div>
            )}

            {archivos.length === 0 ? (
              <p className={style.mensaje}>Esta carpeta no tiene imágenes ni videos.</p>
            ) : (
              <div className={style.archivos}>
                {archivos.map((archivo) => (
                  <div key={archivo.path} className={style.tarjetaArchivo}>
                    <div className={style.vista}>
                      {archivo.url ? (
                        archivo.kind === "video" ? (
                          <video src={archivo.url} controls preload="metadata" />
                        ) : (
                          <img src={archivo.url} alt={archivo.name} />
                        )
                      ) : (
                        <span className={style.sinVista}>Sin vista previa</span>
                      )}
                    </div>
                    <div className={style.pieArchivo}>
                      <span className={style.nombreArchivo} title={archivo.name}>
                        {archivo.name}
                      </span>
                      <button
                        className={style.botonPeligro}
                        onClick={() => void handleEliminarArchivo(archivo.name)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ───────────── Vista: carpetas del bucket ───────────── */
  const llenoCarpetas = creadas >= limites.maxFolders;

  return (
    <div className={style.seccion}>
      <div className={style.cabecera}>
        <div>
          <h2 className={style.titulo}>Storage</h2>
          <p className={style.subtitulo}>Carpetas de tu almacenamiento</p>
        </div>

        <div className={style.crear}>
          <span className={style.contador}>
            {creadas} / {limites.maxFolders} carpetas creadas
          </span>
          <input
            type="text"
            placeholder="Nombre de la carpeta"
            value={nuevoNombre}
            maxLength={40}
            disabled={llenoCarpetas || creando}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCrear()}
          />
          <button
            className={style.botonPrimario}
            disabled={llenoCarpetas || creando}
            onClick={() => void handleCrear()}
          >
            {creando ? "Creando..." : "Nueva carpeta"}
          </button>
        </div>
      </div>

      {error && <p className={style.error}>{error}</p>}

      {carpetas.length === 0 ? (
        <p className={style.mensaje}>No hay carpetas en tu almacenamiento.</p>
      ) : (
        <div className={style.carpetas}>
          {carpetas.map((carpeta) => (
            <div
              key={carpeta.name}
              className={style.carpeta}
              onDoubleClick={() => abrirCarpeta(carpeta.name)}
            >
              <button
                className={style.carpetaBoton}
                onClick={() => abrirCarpeta(carpeta.name)}
                title={carpeta.name}
              >
                <IconoCarpeta />
                <span className={style.carpetaNombre}>{carpeta.name}</span>
                <span className={style.carpetaInfo}>
                  {carpeta.files} {carpeta.files === 1 ? "archivo" : "archivos"}
                  {carpeta.subfolders > 0 && ` · ${carpeta.subfolders} sub.`}
                </span>
              </button>

              {!carpeta.system && (
                <button
                  className={style.carpetaEliminar}
                  title="Eliminar carpeta"
                  onClick={() => void handleEliminarCarpeta(carpeta.name)}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Seccion_1;