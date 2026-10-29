import { useState } from "react";
import style from "./modal.module.css";


/* ───────────── Control segmentado (elige una opción) ─────────────
   Se exporta porque también lo usa parte3.tsx */
interface SegmentadoProps<T extends string> {
  valor: T;
  opciones: { value: T; label: string }[];
  onChange: (v: T) => void;
  etiqueta: string;
}

export const Segmentado = <T extends string>({
  valor,
  opciones,
  onChange,
  etiqueta,
}: SegmentadoProps<T>) => (
  <div className={style.segmentado} role="radiogroup" aria-label={etiqueta}>
    {opciones.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={o.value === valor}
        className={`${style.segmento} ${o.value === valor ? style.segmentoActivo : ""}`}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* ───────────── Tipos y valores iniciales (paso 2) ───────────── */
export type TipoHorario = "fixed" | "flexible" | "libre";
export type TipoRefrigerio = "fixed" | "flexible" | "none";
export type UnidadTolerancia = "min" | "h";

export type TipoInicioRegistro = "fecha" | "primera_asistencia";
export type TipoFinRegistro = "fecha" | "indefinido";

export interface VigenciaAsistenciaState {
  inicioTipo: TipoInicioRegistro;
  fechaInicio: string;
  finTipo: TipoFinRegistro;
  fechaFin: string;
}

export const VIGENCIA_ASISTENCIA_INICIAL: VigenciaAsistenciaState = {
  inicioTipo: "primera_asistencia",
  fechaInicio: "",
  finTipo: "indefinido",
  fechaFin: "",
};

export interface HorarioState {
  tipo: TipoHorario;
  entrada: string; // fixed
  salida: string; // fixed
  tolerancia: string; // valor numérico tal como lo escribe el usuario
  toleranciaUnidad: UnidadTolerancia; // unidad de `tolerancia`
  horas: string; // flexible: horas a cumplir
}

export interface RefrigerioState {
  tipo: TipoRefrigerio;
  inicio: string; // fixed
  fin: string; // fixed
  minutos: string; // flexible
}

export const HORARIO_INICIAL: HorarioState = {
  tipo: "fixed",
  entrada: "",
  salida: "",
  tolerancia: "0",
  toleranciaUnidad: "min",
  horas: "8",
};

export const REFRIGERIO_INICIAL: RefrigerioState = {
  tipo: "fixed",
  inicio: "",
  fin: "",
  minutos: "60",
};

/** Tolerancia siempre expresada en minutos (para guardar o enviar). */
export const toleranciaEnMinutos = (horario: HorarioState): number => {
  const valor = Number(horario.tolerancia) || 0;
  return horario.toleranciaUnidad === "h" ? valor * 60 : valor;
};

/* ───────────── Puestos con horario predefinido ───────────── */
interface PresetPuesto {
  horario: Partial<HorarioState>;
  refrigerio: Partial<RefrigerioState>;
}

// null = el puesto aparece en la lista pero aún no tiene valores predefinidos
export const PUESTOS: Record<string, PresetPuesto | null> = {
  Tienda: {
    horario: { tipo: "fixed", entrada: "06:00", salida: "18:00" },
    refrigerio: { tipo: "flexible" },
  },
  Oficina: {
    horario: { tipo: "fixed", entrada: "07:00", salida: "18:00" },
    refrigerio: { tipo: "flexible" },
  },
};

// Claves de error de cada bloque (para limpiar solo las que corresponden)
export const CLAVES_HORARIO = ["entrada", "salida", "horas"];
export const CLAVES_REFRIGERIO = ["refInicio", "refFin", "refMinutos"];

/* ───────────── Validación del paso 2 ───────────── */
export const validarPaso2 = (
  horario: HorarioState,
  refrigerio: RefrigerioState,
  vigencia: VigenciaAsistenciaState
): Record<string, string> => {
  const e: Record<string, string> = {};

  // Horario
  if (horario.tipo === "fixed") {
    if (!horario.entrada) e.entrada = "Indica la hora de ingreso.";
    if (!horario.salida) e.salida = "Indica la hora de salida.";
    if (horario.entrada && horario.salida && horario.entrada === horario.salida)
      e.salida = "La salida no puede ser igual al ingreso.";
  } else if (horario.tipo === "flexible") {
    const h = Number(horario.horas);
    if (!h || h < 1 || h > 24) e.horas = "Ingresa entre 1 y 24 horas.";
  }

  // Refrigerio
  if (refrigerio.tipo === "fixed") {
    if (!refrigerio.inicio) e.refInicio = "Indica el inicio del refrigerio.";
    if (!refrigerio.fin) e.refFin = "Indica el fin del refrigerio.";
    if (refrigerio.inicio && refrigerio.fin && refrigerio.inicio === refrigerio.fin)
      e.refFin = "El fin no puede ser igual al inicio.";
  } else if (refrigerio.tipo === "flexible") {
    const m = Number(refrigerio.minutos);
    if (!m || m < 1 || m > 240) e.refMinutos = "Ingresa entre 1 y 240 minutos.";
  }

  // Vigencia del registro
  if (vigencia.inicioTipo === "fecha" && !vigencia.fechaInicio) {
    e.fechaInicio = "Indica la fecha de inicio.";
  }

  if (vigencia.finTipo === "fecha" && !vigencia.fechaFin) {
    e.fechaFin = "Indica la fecha de finalización.";
  }

  if (
    vigencia.inicioTipo === "fecha" &&
    vigencia.finTipo === "fecha" &&
    vigencia.fechaInicio &&
    vigencia.fechaFin &&
    vigencia.fechaFin < vigencia.fechaInicio
  ) {
    e.fechaFin = "La fecha final no puede ser anterior a la fecha inicial.";
  }

  return e;
};

/* ───────────── Paso 2: Horario y refrigerio ───────────── */
interface Parte2Props {
  uid: string;
  horario: HorarioState;
  refrigerio: RefrigerioState;
  vigencia: VigenciaAsistenciaState;
  errores: Record<string, string>;
  onHorario: (cambios: Partial<HorarioState>) => void;
  onRefrigerio: (cambios: Partial<RefrigerioState>) => void;
  onVigencia: (cambios: Partial<VigenciaAsistenciaState>) => void;
}

const Parte2 = ({
  uid,
  horario,
  refrigerio,
  vigencia,
  errores,
  onHorario,
  onRefrigerio,
  onVigencia,
}: Parte2Props) => {
  const [puesto, setPuesto] = useState("");

  const idPaso = (clave: string) => `${uid}-p-${clave}`;
  const describedBy = (clave: string) => (errores[clave] ? `${idPaso(clave)}-error` : undefined);

  const errorPaso = (clave: string) =>
    errores[clave] && (
      <span id={`${idPaso(clave)}-error`} className={style.errorCampo}>
        {errores[clave]}
      </span>
    );

  const nocturno =
    horario.tipo === "fixed" &&
    horario.entrada &&
    horario.salida &&
    horario.salida < horario.entrada;

  const aplicarPuesto = (nombre: string) => {
    setPuesto(nombre);
    const preset = PUESTOS[nombre];
    if (!preset) return; // sin valores predefinidos: no cambia nada

    onHorario(preset.horario);
    onRefrigerio({
      ...preset.refrigerio,
      // si los minutos estaban vacíos, la validación fallaría; se deja el valor por defecto
      minutos: refrigerio.minutos || "60",
    });
  };

  return (
    <div className={style.contenedorPaso2}>
      <div className={style.columnas}>
        {/* ── Izquierda: Horario ── */}
        <section className={style.columna}>
          <div className={style.encabezadoSeccion}>
            <h4 className={style.seccion}>Horario</h4>

            <select
              className={`${style.input} ${style.selectPuesto}`}
              value={puesto}
              onChange={(e) => aplicarPuesto(e.target.value)}
              aria-label="Puesto con horario predefinido"
            >
              <option value="">Horario predefinido…</option>
              {Object.keys(PUESTOS).map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

          <Segmentado<TipoHorario>
            etiqueta="Tipo de horario"
            valor={horario.tipo}
            onChange={(v) => onHorario({ tipo: v })}
            opciones={[
              { value: "fixed", label: "Horario fijo" },

   
            ]}
          />

          {horario.tipo === "fixed" ? (
            <>
              <div className={style.fila}>
                <div className={style.campo}>
                  <label className={style.etiqueta} htmlFor={idPaso("entrada")}>
                    Ingreso laboral <span className={style.requerido}>*</span>
                  </label>
                  <input
                    id={idPaso("entrada")}
                    className={style.input}
                    type="time"
                    value={horario.entrada}
                    onChange={(e) => onHorario({ entrada: e.target.value })}
                    aria-invalid={!!errores.entrada}
                    aria-describedby={describedBy("entrada")}
                  />
                  {errorPaso("entrada")}
                </div>

                <div className={style.campo}>
                  <label className={style.etiqueta} htmlFor={idPaso("salida")}>
                    Salida laboral <span className={style.requerido}>*</span>
                  </label>
                  <input
                    id={idPaso("salida")}
                    className={style.input}
                    type="time"
                    value={horario.salida}
                    onChange={(e) => onHorario({ salida: e.target.value })}
                    aria-invalid={!!errores.salida}
                    aria-describedby={describedBy("salida")}
                  />
                  {errorPaso("salida")}
                </div>
              </div>

              {nocturno && <p className={style.ayuda}>Turno nocturno: la salida es al día siguiente.</p>}

              <div className={style.fila}>
               
              </div>
            </>
          ) : horario.tipo === "flexible" ? (
            <>
              <div className={style.fila}>
                <div className={style.campo}>
                  <label className={style.etiqueta} htmlFor={idPaso("horas")}>
                    Tiempo laboral (horas) <span className={style.requerido}>*</span>
                  </label>
                  <input
                    id={idPaso("horas")}
                    className={style.input}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="Ej. 8"
                    value={horario.horas}
                    onChange={(e) => onHorario({ horas: e.target.value.replace(/\D/g, "") })}
                    aria-invalid={!!errores.horas}
                    aria-describedby={describedBy("horas")}
                  />
                  {errorPaso("horas")}
                </div>
              </div>

              <p className={style.ayuda}>
                Puede ingresar a cualquier hora, pero debe cumplir las horas indicadas.
              </p>
            </>
          ) : (
            <p className={style.ayuda}>Puede ingresar a cualquier hora.</p>
          )}
        </section>

        {/* ── Derecha: Refrigerio ── */}
        <section className={`${style.columna} ${style.columnaDerecha}`}>
          <h4 className={style.seccion}>Refrigerio</h4>

          <Segmentado<TipoRefrigerio>
            etiqueta="Tipo de refrigerio"
            valor={refrigerio.tipo}
            onChange={(v) => onRefrigerio({ tipo: v })}
            opciones={[
              { value: "fixed", label: "Fijo" },
              { value: "flexible", label: "Flexible" },
            ]}
          />

          {refrigerio.tipo === "fixed" && (
            <>
              <div className={style.campo}>
                <label className={style.etiqueta} htmlFor={idPaso("refInicio")}>
                  Inicio de su refrigerio <span className={style.requerido}>*</span>
                </label>
                <input
                  id={idPaso("refInicio")}
                  className={style.input}
                  type="time"
                  value={refrigerio.inicio}
                  onChange={(e) => onRefrigerio({ inicio: e.target.value })}
                  aria-invalid={!!errores.refInicio}
                  aria-describedby={describedBy("refInicio")}
                />
                {errorPaso("refInicio")}
              </div>

              <div className={style.campo}>
                <label className={style.etiqueta} htmlFor={idPaso("refFin")}>
                  Fin de su refrigerio <span className={style.requerido}>*</span>
                </label>
                <input
                  id={idPaso("refFin")}
                  className={style.input}
                  type="time"
                  value={refrigerio.fin}
                  onChange={(e) => onRefrigerio({ fin: e.target.value })}
                  aria-invalid={!!errores.refFin}
                  aria-describedby={describedBy("refFin")}
                />
                {errorPaso("refFin")}
              </div>
            </>
          )}

          {refrigerio.tipo === "flexible" && (
            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idPaso("refMinutos")}>
                Duración (minutos) <span className={style.requerido}>*</span>
              </label>
              <input
                id={idPaso("refMinutos")}
                className={style.input}
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="Ej. 60"
                value={refrigerio.minutos}
                onChange={(e) => onRefrigerio({ minutos: e.target.value.replace(/\D/g, "") })}
                aria-invalid={!!errores.refMinutos}
                aria-describedby={describedBy("refMinutos")}
              />
              {errorPaso("refMinutos")}
              <p className={style.ayuda}>El o ella gestionara su propio refrigerio.</p>
            </div>
          )}

          {refrigerio.tipo === "none" && (
            <p className={style.ayuda}>El trabajador no tendrá refrigerio.</p>
          )}
        </section>
      </div>

      {/* ── Vigencia del registro ── */}
      <section className={style.registroCompleto}>
        <h4 className={style.tituloRegistro}>Contrato</h4>

        {/* Columna izquierda: inicio */}
        <div className={style.columnaRegistro}>
          <div className={style.campo}>
            <span className={style.etiqueta}>¿Cuándo comenzará a laborar?</span>
            <Segmentado<TipoInicioRegistro>
              etiqueta="Inicio del registro"
              valor={vigencia.inicioTipo}
              onChange={(v) => onVigencia({ inicioTipo: v })}
              opciones={[
                { value: "fecha", label: "Desde una fecha" },
                { value: "primera_asistencia", label: "Desde su primera asistencia" },
              ]}
            />
          </div>

          {vigencia.inicioTipo === "fecha" ? (
            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idPaso("fechaInicio")}>
                Fecha de inicio <span className={style.requerido}>*</span>
              </label>
              <input
                id={idPaso("fechaInicio")}
                className={style.input}
                type="date"
                value={vigencia.fechaInicio}
                onChange={(e) => onVigencia({ fechaInicio: e.target.value })}
                aria-invalid={!!errores.fechaInicio}
                aria-describedby={describedBy("fechaInicio")}
              />
              {errorPaso("fechaInicio")}
            </div>
          ) : (
            <p className={style.ayuda}>
              El registro comenzará automáticamente cuando el trabajador registre su primera
              asistencia válida.
            </p>
          )}
        </div>

        {/* Columna derecha: fin */}
        <div className={style.columnaRegistro}>
          <div className={style.campo}>
            <span className={style.etiqueta}>¿Cuándo finalizará su contrato?</span>
            <Segmentado<TipoFinRegistro>
              etiqueta="Fin del registro"
              valor={vigencia.finTipo}
              onChange={(v) => onVigencia({ finTipo: v })}
              opciones={[
                { value: "fecha", label: "Hasta una fecha" },
                { value: "indefinido", label: "Indefinido" },
              ]}
            />
          </div>

          {vigencia.finTipo === "fecha" ? (
            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idPaso("fechaFin")}>
                Fecha de finalización <span className={style.requerido}>*</span>
              </label>
              <input
                id={idPaso("fechaFin")}
                className={style.input}
                type="date"
                min={
                  vigencia.inicioTipo === "fecha" && vigencia.fechaInicio
                    ? vigencia.fechaInicio
                    : undefined
                }
                value={vigencia.fechaFin}
                onChange={(e) => onVigencia({ fechaFin: e.target.value })}
                aria-invalid={!!errores.fechaFin}
                aria-describedby={describedBy("fechaFin")}
              />
              {errorPaso("fechaFin")}
            </div>
          ) : (
            <p className={style.ayuda}>
              El registro permanecerá vigente hasta que un administrador termine su contrato manualmente.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Parte2;