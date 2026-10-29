import { useCallback, useEffect, useState } from "react";
import { callBackend } from "../../../../../../core/services/backend";
import type { StaffAttendance } from "../../../../types/register.types";
import style from "./modal_advancements.module.css";

/* ═════════════════════════════════════════════════════════════════════════════
 * Pestaña "Adelantos" del modal de un registro.
 * Todo vive en este archivo: tipos, llamadas al backend, hook y vista.
 * El adelanto se crea para el personal del registro que se abrió (registro.stff_id).
 * ═════════════════════════════════════════════════════════════════════════════ */

const MAX_DESCRIPCION = 500; // el backend también lo valida
const POR_PAGINA = 10;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* ───────── Tipos ───────── */

interface Adelanto {
  id: number;
  stff_id: number;
  stff_name: string;
  stff_lastname: string;
  /** Quién entregó el dinero (null = el dueño). */
  delivered_by_staff_id: number | null;
  delivered_by_name: string | null;
  amount: number;
  description: string | null;
  /** YYYY-MM-DD */
  date: string;
}

interface AdelantosResponse {
  items: Adelanto[];
  count: number;
}

type AdelantoPayload = {
  stffId: number;
  amount: number;
  description: string | null;
};

/** Quién está usando el sistema (staffId null = el dueño). */
interface Actor {
  staffId: number | null;
  name: string | null;
}

/* ───────── Llamadas al backend ───────── */

const getAdelantos = (stffId: number, page: number): Promise<AdelantosResponse> =>
  callBackend<AdelantosResponse>("staff-advancements", {
    query: { stffId, page, pageSize: POR_PAGINA },
  });

const createAdelanto = (payload: AdelantoPayload): Promise<Adelanto> =>
  callBackend<Adelanto>("staff-advancements", { method: "POST", body: payload });

const updateAdelanto = (id: number, payload: AdelantoPayload): Promise<Adelanto> =>
  callBackend<Adelanto>("staff-advancements", { method: "PATCH", query: { id }, body: payload });

const getActor = (): Promise<Actor> => callBackend<Actor>("staff-advancements/actor");


/* ───────── Apoyo ───────── */

/** "2026-10-26" → "26 Oct 2026" */
const formatFecha = (fecha: string): string => {
  const [year, month, day] = fecha.split("-").map(Number);
  return `${day} ${MESES[month - 1] ?? ""} ${year}`;
};

const formatMonto = (monto: number): string => `S/ ${monto.toFixed(2)}`;

const nombreCompleto = (nombre: string, apellido: string): string => `${nombre} ${apellido}`.trim();

/** Texto de "Entregado por": el nombre del staff, o "Super admin" cuando lo entregó el dueño. */
const textoEntrega = (nombre: string | null): string => nombre ?? "Super admin";

const mensajeDe = (error: unknown, porDefecto: string): string =>
  error instanceof Error ? error.message : porDefecto;

/** Más recientes primero (misma regla que el backend). */
const ordenar = (lista: Adelanto[]): Adelanto[] =>
  [...lista].sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));

/* ───────── Quién está autenticado (es quien entrega el adelanto; sale del JWT en el backend) ───────── */

const useActor = () => {
  const [actor, setActor] = useState<Actor | null>(null);

  useEffect(() => {
    let cancelado = false;
    getActor()
      .then((a) => {
        if (!cancelado) setActor(a);
      })
      .catch(() => {
        // Si falla, se asume que no hay preselección: "Super admin" (sin bloquear el formulario).
        if (!cancelado) setActor({ staffId: null, name: null });
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return actor;
};

/* ───────── Adelantos del personal ───────── */

const useAdelantosDe = (stffId: number) => {
  const [lista, setLista] = useState<Adelanto[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    getAdelantos(stffId, 1)
      .then((r) => {
        if (cancelado) return;
        setLista(r.items);
        setTotal(r.count);
        setPagina(1);
        setError("");
      })
      .catch((e) => {
        if (!cancelado) setError(mensajeDe(e, "No se pudieron cargar los adelantos."));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [stffId]);

  const cargarMas = useCallback(async () => {
    setCargandoMas(true);
    try {
      const r = await getAdelantos(stffId, pagina + 1);
      setLista((previa) => {
        const ids = new Set(previa.map((a) => a.id));
        return [...previa, ...r.items.filter((a) => !ids.has(a.id))];
      });
      setTotal(r.count);
      setPagina((p) => p + 1);
    } catch (e) {
      setError(mensajeDe(e, "No se pudieron cargar más adelantos."));
    } finally {
      setCargandoMas(false);
    }
  }, [stffId, pagina]);

  const crear = useCallback(async (payload: AdelantoPayload) => {
    const nuevo = await createAdelanto(payload);
    setLista((previa) => ordenar([nuevo, ...previa]));
    setTotal((t) => t + 1);
  }, []);

  const editar = useCallback(async (id: number, payload: AdelantoPayload) => {
    const actualizado = await updateAdelanto(id, payload);
    setLista((previa) => ordenar(previa.map((a) => (a.id === id ? actualizado : a))));
  }, []);

  return { lista, total, cargando, cargandoMas, error, cargarMas, crear, editar };
};

/* ───────── Formulario (sirve para crear y para editar) ───────── */

interface FormularioProps {
  stffId: number;
  /** Si viene, edita ese adelanto; si no, crea uno nuevo. */
  adelanto?: Adelanto;
  /** Quien está autenticado: es quien entrega al crear. null mientras carga. */
  actor: Actor | null;
  textoBoton: string;
  textoGuardando: string;
  /** Lanza el error del backend si falla (el formulario lo muestra). */
  onGuardar: (payload: AdelantoPayload) => Promise<void>;
  onCancelar?: () => void;
}

const Formulario = ({
  stffId,
  adelanto,
  actor,
  textoBoton,
  textoGuardando,
  onGuardar,
  onCancelar,
}: FormularioProps) => {
  // Al crear entrega quien está autenticado; al editar se conserva quien entregó (no se puede cambiar).
  const cargandoActor = !adelanto && actor === null;
  const entregadoPor = textoEntrega(adelanto ? adelanto.delivered_by_name : (actor?.name ?? null));

  const [monto, setMonto] = useState(adelanto ? String(adelanto.amount) : "");
  const [descripcion, setDescripcion] = useState(adelanto?.description ?? "");
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");

  const montoNumero = Number(monto);
  const errorMonto = monto.trim() === "" || !(montoNumero > 0);

  const enviar = async () => {
    setIntento(true);
    if (errorMonto || guardando || cargandoActor) return;

    setGuardando(true);
    setErrorGuardar("");
    try {
      await onGuardar({
        stffId,
        amount: montoNumero,
        description: descripcion.trim() === "" ? null : descripcion.trim(),
        // La fecha no se envía: el backend usa la del día en que se crea y no la cambia al editar.
      });

      if (!adelanto) {
        // Adelanto creado: se limpia para poder registrar otro.
        setMonto("");
        setDescripcion("");
        setIntento(false);
      }
    } catch (e) {
      setErrorGuardar(mensajeDe(e, "No se pudo guardar el adelanto."));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className={style.fila}>
        <label className={style.campo}>
          <span className={style.etiqueta}>Importe *</span>
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
              disabled={guardando}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          {intento && errorMonto && <span className={style.error}>Ingresa un importe mayor a 0.</span>}
        </label>

        <label className={style.campo}>
          <span className={style.etiqueta}>Entregado por</span>
          <input
            className={`${style.input} ${style.inputBloqueado}`}
            value={cargandoActor ? "Cargando…" : entregadoPor}
            disabled
            readOnly
          />
        </label>
      </div>

      <label className={style.campo}>
        <span className={style.etiqueta}>Motivo o descripción</span>
        <textarea
          className={style.textarea}
          rows={3}
          placeholder="Motivo del adelanto (opcional)…"
          maxLength={MAX_DESCRIPCION}
          value={descripcion}
          disabled={guardando}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>

      {errorGuardar && (
        <span className={style.error} role="alert">
          {errorGuardar}
        </span>
      )}

      <div className={style.pieFormulario}>
        {onCancelar && (
          <button type="button" className={style.btnSecundario} disabled={guardando} onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className={style.btnPrimario} disabled={guardando || cargandoActor} onClick={() => void enviar()}>
          {guardando ? textoGuardando : textoBoton}
        </button>
      </div>
    </>
  );
};

/* ───────── Pestaña ───────── */

const ModalAdvancements = ({ registro }: { registro: StaffAttendance }) => {
  const actor = useActor();
  const { lista, total, cargando, cargandoMas, error, cargarMas, crear, editar } = useAdelantosDe(
    registro.stff_id
  );
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const nombre = nombreCompleto(registro.stff_name, registro.stff_lastname);

  return (
    <div className={style.contenedor}>
      {/* ───────── Crear adelanto ───────── */}
      <section className={style.formulario}>
        <h4 className={style.subtitulo}>Nuevo adelanto</h4>

        <label className={style.campo}>
          <span className={style.etiqueta}>Personal que recibe</span>
          <input className={`${style.input} ${style.inputBloqueado}`} value={nombre} disabled readOnly />
        </label>

        <Formulario
          stffId={registro.stff_id}
          actor={actor}
          textoBoton="Crear adelanto"
          textoGuardando="Creando…"
          onGuardar={crear}
        />
      </section>

      {/* ───────── Adelantos de este personal ───────── */}
      <section className={style.listado}>
        <h4 className={style.subtitulo}>
          Adelantos de {registro.stff_name} <span className={style.contador}>{total}</span>
        </h4>

        {cargando && lista.length === 0 ? (
          <p className={style.vacio}>Cargando adelantos…</p>
        ) : error && lista.length === 0 ? (
          <p className={style.error} role="alert">
            {error}
          </p>
        ) : lista.length === 0 ? (
          <p className={style.vacio}>Este personal no tiene adelantos.</p>
        ) : (
          <>
            <ul className={style.lista}>
              {lista.map((a) => (
                <li key={a.id} className={style.item}>
                  {editandoId === a.id ? (
                    <div className={style.edicion}>
                      <Formulario
                        stffId={registro.stff_id}
                        adelanto={a}
                        actor={actor}
                        textoBoton="Guardar cambios"
                        textoGuardando="Guardando…"
                        onGuardar={async (payload) => {
                          await editar(a.id, payload);
                          setEditandoId(null);
                        }}
                        onCancelar={() => setEditandoId(null)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={style.itemCabecera}>
                        <span className={style.tipo}>{formatFecha(a.date)}</span>
                        <span className={style.itemMonto}>{formatMonto(a.amount)}</span>
                      </div>
                      {a.description && <p className={style.itemDescripcion}>{a.description}</p>}
                      <div className={style.itemPie}>
                        <span className={style.itemMeta}>
                          Entregado por {textoEntrega(a.delivered_by_name)}
                        </span>
                        <button type="button" className={style.btnEditar} onClick={() => setEditandoId(a.id)}>
                          Editar
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {error && (
              <span className={style.error} role="alert">
                {error}
              </span>
            )}

            {lista.length < total && (
              <button
                type="button"
                className={`${style.btnSecundario} ${style.btnMas}`}
                disabled={cargandoMas}
                onClick={() => void cargarMas()}
              >
                {cargandoMas ? "Cargando…" : "Ver más"}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ModalAdvancements;