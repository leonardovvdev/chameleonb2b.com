import type { ReactNode } from "react";
import { useEffect } from "react";
import style from "./modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => {
  // Cierra con la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={style.overlay} onClick={onClose}>
      <div className={style.contenido} onClick={(e) => e.stopPropagation()}>
        <div className={style.header}>
          <h3>{title}</h3>
          <button className={style.cerrar} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className={style.body}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;