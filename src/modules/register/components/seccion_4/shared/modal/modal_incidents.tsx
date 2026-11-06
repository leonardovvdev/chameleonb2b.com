import { useState } from "react";
import type { StaffAttendance } from "../../../../types/register.types";
import { useIncidencias, usePuedeEliminar } from "../../../../controllers/register.controller";
import style from "./modal_incidents.module.css";

const MAX_DESCRIPCION = 200; // el backend también lo valida

const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

const formatMonto = (monto: number): string => `S/ ${monto.toFixed(2)}`;

export const BotonTacho = ({ etiqueta, onEliminar }: { etiqueta: string; onEliminar: () => Promise<void> }) => {
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  const confirmar = async () => {
    setEliminando(true);
    setError("");
    try {
      await onEliminar(); // al eliminar, el item sale de la lista y este botón desaparece con él
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      setEliminando(false);
      setConfirmando(false);
    }
  };

  if (confirmando) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        ¿Eliminar?
        <button
          type="button"
          disabled={eliminando}
          onClick={() => void confirmar()}
          style={{ border: "none", background: "#b91c1c", color: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
        >
          {eliminando ? "…" : "Sí"}
        </button>
        <button
          type="button"
          disabled={eliminando}
          onClick={() => setConfirmando(false)}
          style={{ border: "1px solid #cbd5e1", background: "#0f0f0f", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
        >
          No
        </button>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        title={etiqueta}
        aria-label={etiqueta}
        onClick={() => setConfirmando(true)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#b91c1c", display: "inline-flex" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
      {error && (
        <span role="alert" style={{ color: "#b91c1c", fontSize: 12 }}>
          {error}
        </span>
      )}
    </>
  );
};

interface ModalIncidentsProps {
  registro: StaffAttendance;
  onCreada: (total: number) => void;
  
  /** Total de incidencias que quedan después de eliminar una (para actualizar la tabla). */
  onEliminada: (total: number) => void;
}

const ModalIncidents = ({ registro, onCreada, onEliminada }: ModalIncidentsProps) => {
  const { lista, cargando, error, crear, eliminar } = useIncidencias(registro.att_id);
  const puedeEliminar = usePuedeEliminar();
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [intento, setIntento] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState("");

  const montoNumero = Number(monto);
  const errorDescripcion = descripcion.trim() === "";
  const errorMonto = monto.trim() === "" || !(montoNumero > 0);

  const enviar = async () => {
    setIntento(true);
    if (errorDescripcion || errorMonto || creando) return;

    setCreando(true);
    setErrorCrear("");
    try {
      await crear(descripcion.trim(), montoNumero);
      onCreada(lista.length + 1);
      setDescripcion("");
      setMonto("");
      setIntento(false);
    } catch (e) {
      setErrorCrear(e instanceof Error ? e.message : "No se pudo crear la incidencia.");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className={style.contenedor}>
      {/* ───────── Crear incidencia ───────── */}
      <section className={style.formulario}>
        <h4 className={style.subtitulo}>Nueva incidencia</h4>

        <label className={style.campo}>
          <span className={style.etiqueta}>Monto *</span>
          <div className={`${style.montoCaja} ${intento && errorMonto ? style.invalido : ""}`}>
            <span className={style.moneda}>S/</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className={style.inputMonto}
              placeholder="0.00"
              value={monto}
              disabled={creando}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          {intento && errorMonto && <span className={style.error}>Ingresa un monto mayor a 0.</span>}
        </label>
        
        <label className={style.campo}>
          <span className={style.etiqueta}>Descripción *</span>
          <textarea
            className={`${style.textarea} ${intento && errorDescripcion ? style.invalido : ""}`}
            rows={3}
            placeholder="Describe lo ocurrido…"
            maxLength={MAX_DESCRIPCION}
            value={descripcion}
            disabled={creando}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          {intento && errorDescripcion && (
            <span className={style.error}>La descripción es obligatoria.</span>
          )}
        </label>

        {errorCrear && <span className={style.error}>{errorCrear}</span>}

        <div className={style.pieFormulario}>
          <span className={style.nota}>Se registrará con tu usuario actual.</span>
          <button type="button" className={style.btnPrimario} disabled={creando} onClick={() => void enviar()}>
            {creando ? "Creando…" : "Crear incidencia"}
          </button>
        </div>
      </section>

      {/* ───────── Incidencias de este registro ───────── */}
      <section className={style.listado}>
        <h4 className={style.subtitulo}>
          Incidencias de este registro <span className={style.contador}>{lista.length}</span>
        </h4>

        {cargando && lista.length === 0 ? (
          <p className={style.vacio}>Cargando incidencias…</p>
        ) : error && lista.length === 0 ? (
          <p className={style.error} role="alert">
            {error}
          </p>
        ) : lista.length === 0 ? (
          <p className={style.vacio}>Este registro no tiene incidencias.</p>
        ) : (
          <ul className={style.lista}>
            {lista.map((inc) => (
              <li key={inc.id} className={style.item}>
               <div className={style.itemCabecera}>
  <span className={style.itemMonto}>{formatMonto(inc.amount)}</span>
  {puedeEliminar && (
    <BotonTacho
      etiqueta="Eliminar incidencia"
      onEliminar={async () => {
        const total = await eliminar(inc.id);
        onEliminada(total);
      }}
    />
  )}
</div>
                <p className={style.itemDescripcion}>{inc.description}</p>
                <span className={style.itemMeta}>
                  Registrado por {inc.created_by_name ?? (inc.created_by_staff_id ? `staff #${inc.created_by_staff_id}` : "el titular de la cuenta")}
                  {inc.created_at ? ` · ${formatFecha(inc.created_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ModalIncidents;