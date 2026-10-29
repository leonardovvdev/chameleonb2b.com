import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import style from "./modal.module.css";
import {
  ApiError,
  createJobPosition,
  deleteJobPosition,
  updateJobPosition,
} from "../../../services/job-position.service";
import type { JobPosition } from "../../../types/job-position.types";

export type ModoModal = "crear" | "editar" | "eliminar";

interface ModalProps {
  modo: ModoModal;
  /** Requerido en "editar" y "eliminar" */
  cargo: JobPosition | null;
  onClose: () => void;
  /** Se llama después de completar la acción correctamente */
  onGuardado: () => void;
}

const TITULOS: Record<ModoModal, string> = {
  crear: "Crear Cargo",
  editar: "Editar Cargo",
  eliminar: "Eliminar Cargo",
};

const VERBOS: Record<ModoModal, string> = {
  crear: "crear",
  editar: "actualizar",
  eliminar: "eliminar",
};

const Modal = ({ modo, cargo, onClose, onGuardado }: ModalProps) => {
  const [nombre, setNombre] = useState(cargo?.name ?? "");
  const [descripcion, setDescripcion] = useState(cargo?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Escape para cerrar + bloquear scroll del fondo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowPrevio;
    };
  }, [onClose, saving]);

  // ---------------------------------------------------------
  // Operaciones contra backend-chameleonb2b
  // ---------------------------------------------------------
  const ejecutar = async () => {
    if (modo === "eliminar") {
      await deleteJobPosition(cargo!.id);
      return;
    }

    const input = {
      name: nombre.trim(),
      description: descripcion.trim() || null,
    };

    if (modo === "editar") {
      await updateJobPosition(cargo!.id, input);
      return;
    }

    await createJobPosition(input);
  };

  /** Errores controlados del backend (400/401/403/404/409) se muestran tal cual. */
  const mensajeError = (err: unknown) => {
    if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
      return err.message;
    }
    return `No se pudo ${VERBOS[modo]} el cargo.`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (modo !== "eliminar" && !nombre.trim()) {
      setError("El nombre del cargo es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await ejecutar();
    } catch (err) {
      console.error(`ERROR AL ${modo.toUpperCase()} CARGO:`, err);
      setError(mensajeError(err));
      setSaving(false);
      return;
    }

    setSaving(false);
    onGuardado();
  };

  const eliminando = modo === "eliminar";

  return createPortal(
    <div
      className={style.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        className={style.contenido}
        role="dialog"
        aria-modal="true"
        aria-label={TITULOS[modo]}
        onSubmit={handleSubmit}
      >
        <h3 className={style.titulo}>{TITULOS[modo]}</h3>

        <div className={style.cuerpo}>
          {eliminando ? (
            <p className={style.mensaje}>
              ¿Seguro que deseas eliminar el cargo{" "}
              <b>"{cargo?.name}"</b>? Esta acción no se puede deshacer.
            </p>
          ) : (
            <>
              <label className={style.label} htmlFor="cargo-nombre">
                Nombre
              </label>
              <input
                id="cargo-nombre"
                className={style.input}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Administrador"
                maxLength={200}
                autoFocus
              />

              <label className={style.label} htmlFor="cargo-descripcion">
                Descripción
              </label>
              <textarea
                id="cargo-descripcion"
                className={style.textarea}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe las funciones del cargo..."
              />
            </>
          )}

          {error && <span className={style.textoError}>{error}</span>}
        </div>

        <div className={style.acciones}>
          <button
            type="button"
            className={style.botonSecundario}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={eliminando ? style.botonPeligro : style.boton}
            disabled={saving}
          >
            {saving ? "Guardando..." : eliminando ? "Eliminar" : "Guardar"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default Modal;