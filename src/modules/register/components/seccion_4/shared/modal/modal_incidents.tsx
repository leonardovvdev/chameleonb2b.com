import { useState } from "react";
import type { StaffAttendance } from "../../../../types/register.types";
import { useIncidencias } from "../../../../controllers/register.controller";
import style from "./modal_incidents.module.css";

const MAX_DESCRIPCION = 200; // el backend también lo valida

const formatFecha = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

const formatMonto = (monto: number): string => `S/ ${monto.toFixed(2)}`;

const ModalIncidents = ({ registro }: { registro: StaffAttendance }) => {
  const { lista, cargando, error, crear } = useIncidencias(registro.att_id);
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

        <div className={style.fila}>
          <label className={style.campo}>
            <span className={style.etiqueta}>Tipo</span>
            <input className={`${style.input} ${style.inputBloqueado}`} value="Otro" disabled readOnly />
          </label>
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
        </div>

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
                  <span className={style.tipo}>Otro</span>
                  <span className={style.itemMonto}>{formatMonto(inc.amount)}</span>
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