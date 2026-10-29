import { useEffect, useRef, useState } from "react";
import style from "./modal.module.css";
import { icon } from "../../../../../core/icons";
import {
  getCustomerJobPositions,
  getCustomerRoles,
  getSupervisors,
} from "../../../../../core/services";
import type { SupervisorItem } from "../../../../../core/types";

/** El código del sistema nunca llega al navegador: se muestra enmascarado (11 dígitos). */
const CODIGO_SISTEMA_OCULTO = "*".repeat(11);

/* ───────────── Tipos y valores iniciales (paso 1) ───────────── */
const TEXTO_REGEX = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;

export interface FormState {
  cust_role_id: string; // opcional
  stff_name: string;
  stff_lastname: string;
  stff_dni: string;
  stff_phone: string;
  jb_pstn_cust_id: string;
  stff_supervisor_id: string;
  stff_password: string;
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

export const FORM_INICIAL: FormState = {
  cust_role_id: "",
  stff_name: "",
  stff_lastname: "",
  stff_dni: "",
  stff_phone: "",
  jb_pstn_cust_id: "",
  stff_supervisor_id: "",
  stff_password: "",
};

export interface Opcion {
  value: string;
  label: string;
  sublabel?: string;
  avatar?: string | null;
}

/** Opciones que carga este paso y que el modal necesita para el resumen (paso 5). */
export interface OpcionesCargadas {
  cargos?: Opcion[];
  jefes?: Opcion[];
}

/** Convierte los cargos / roles del customer en opciones del <Select>.
 *  No se usa `sublabel`: activaría los avatares de iniciales en el menú. */
const aOpciones = (items: { id: number; name: string }[]): Opcion[] =>
  items.map((item) => ({ value: String(item.id), label: item.name }));

/** Convierte los supervisores del backend en opciones del <Select>.
 *  Con `sublabel` el Select muestra avatar + (cargo); si no hay cargo va ""
 *  para que igual se vea el avatar. */
const aOpcionesJefes = (items: SupervisorItem[]): Opcion[] =>
  items.map((s) => ({
    value: String(s.id),
    label: `${s.name} ${s.lastname}`,
    sublabel: s.job_position ?? "",
    avatar: s.img_url,
  }));

/* ───────────── Validación del paso 1 ───────────── */
export const validarPaso1 = (
  form: FormState,
  conAcceso: boolean,
  haySupervisores = true,
  /** En edición, si el personal ya tenía acceso, dejar la contraseña vacía = no cambiarla. */
  passwordOpcional = false
): FormErrors => {
  const e: FormErrors = {};
  const nombre = form.stff_name.trim();
  const apellido = form.stff_lastname.trim();

  if (!nombre) e.stff_name = "El nombre es obligatorio.";
  else if (!TEXTO_REGEX.test(nombre.replace(/\s+/g, " ")))
    e.stff_name = "El nombre solo puede contener letras.";

  if (!apellido) e.stff_lastname = "El apellido es obligatorio.";
  else if (!TEXTO_REGEX.test(apellido.replace(/\s+/g, " ")))
    e.stff_lastname = "El apellido solo puede contener letras.";

  if (!/^\d{8}$/.test(form.stff_dni)) e.stff_dni = "El DNI debe tener exactamente 8 dígitos.";
  if (form.stff_phone !== "" && !/^\d{9}$/.test(form.stff_phone))
    e.stff_phone = "El teléfono debe tener exactamente 9 dígitos.";
  if (!form.jb_pstn_cust_id) e.jb_pstn_cust_id = "Selecciona un cargo.";

  // El primer personal del cliente no puede tener jefe:
  // el supervisor solo es obligatorio si ya existen supervisores.
  if (haySupervisores && !form.stff_supervisor_id)
    e.stff_supervisor_id = "Asigna un jefe inmediato.";

  if (conAcceso && form.stff_password.length < 6 && !(passwordOpcional && form.stff_password === ""))
    e.stff_password = "La contraseña debe tener al menos 6 caracteres.";

  return e;
};

/* ───────────── Select personalizado ───────────── */
interface SelectProps {
  id: string;
  value: string;
  opciones: Opcion[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalido?: boolean;
  describedBy?: string;
  buscable?: boolean;
  placeholderBusqueda?: string;
}

const Avatar = ({ opcion }: { opcion: Opcion }) =>
  opcion.avatar ? (
    <img src={opcion.avatar} alt="" className={style.avatar} />
  ) : (
    <span className={`${style.avatar} ${style.avatarInicial}`}>
      {opcion.label.charAt(0).toUpperCase()}
    </span>
  );

const Select = ({
  id,
  value,
  opciones,
  placeholder,
  onChange,
  disabled,
  invalido,
  describedBy,
  buscable = false,
  placeholderBusqueda = "Buscar...",
}: SelectProps) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const seleccionada = opciones.find((o) => o.value === value);
  const conAvatar = opciones.some((o) => o.sublabel !== undefined);

  const texto = busqueda.trim().toLowerCase();
  const opcionesFiltradas =
    buscable && texto
      ? opciones.filter((o) => o.label.toLowerCase().includes(texto))
      : opciones;

  const cerrarMenu = () => {
    setAbierto(false);
    setBusqueda("");
  };

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [abierto]);

  const elegir = (v: string) => {
    onChange(v);
    cerrarMenu();
  };

  return (
    <div
      className={style.select}
      ref={ref}
      onKeyDown={(e) => {
        // Escape cierra solo el dropdown, no el modal
        if (e.key === "Escape" && abierto) {
          e.stopPropagation();
          cerrarMenu();
        }
      }}
    >
      <button
        id={id}
        type="button"
        className={`${style.selectBoton} ${abierto ? style.selectAbierto : ""}`}
        onClick={() => (abierto ? cerrarMenu() : setAbierto(true))}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-invalid={invalido}
        aria-describedby={describedBy}
      >
        <span className={seleccionada ? style.selectTexto : style.selectPlaceholder}>
          {seleccionada ? seleccionada.label : placeholder}
        </span>

        <icon.iconArrowDown
          className={`${style.iconArrowDown} ${abierto ? style.iconArrowDownAbierto : ""}`}
        />
      </button>

      {abierto && (
        <div className={style.selectMenu}>
          {buscable && (
            <div className={style.selectBusqueda}>
              <icon.iconMagnifyingGlass className={style.iconoBusqueda} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={placeholderBusqueda}
                className={style.inputBusqueda}
                autoFocus
              />
            </div>
          )}

          <ul className={style.selectLista} role="listbox">
            {!texto && (
              <li
                role="option"
                aria-selected={value === ""}
                className={`${style.selectOpcion} ${style.selectOpcionPlaceholder}`}
                onClick={() => elegir("")}
              >
                {placeholder}
              </li>
            )}

            {opcionesFiltradas.map((o) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                className={style.selectOpcion}
                onClick={() => elegir(o.value)}
              >
                {conAvatar && <Avatar opcion={o} />}
                <span className={style.opcionTextos}>
                  <span className={style.opcionLabel}>{o.label}</span>
                  {o.sublabel && <span className={style.opcionSublabel}>({o.sublabel})</span>}
                </span>
                {o.value === value && <icon.iconCheck className={style.opcionCheck} />}
              </li>
            ))}

            {opcionesFiltradas.length === 0 && (
              <li className={style.sinResultados}>Sin resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ───────────── Paso 1: Datos personales ───────────── */
interface Parte1Props {
  uid: string;
  form: FormState;
  errores: FormErrors;
  conAcceso: boolean;
  onCambio: (campo: keyof FormState, valor: string) => void;
  onAcceso: (activo: boolean) => void;
  /** Avisa al padre si el customer ya tiene supervisores (la validación depende de eso). */
  onSupervisoresCargados?: (hay: boolean) => void;
  /** Entrega al padre los cargos y supervisores cargados (los necesita el resumen del paso 5). */
  onOpcionesCargadas?: (opciones: OpcionesCargadas) => void;
  /** Edición: id del propio personal, para que no pueda elegirse como su jefe. */
  excluirSupervisorId?: string;
  /** Edición: ya tenía acceso, la contraseña se puede dejar vacía. */
  passwordOpcional?: boolean;
}

const Parte1 = ({
  uid,
  form,
  errores,
  conAcceso,
  onCambio,
  onAcceso,
  onSupervisoresCargados,
  onOpcionesCargadas,
  excluirSupervisorId,
  passwordOpcional = false,
}: Parte1Props) => {
  // Siempre apunta al último callback sin obligar a repetir las cargas
  const opcionesCargadasRef = useRef(onOpcionesCargadas);
  opcionesCargadasRef.current = onOpcionesCargadas;

  // Solo es visual: no se considera un dato del formulario
  const [verPassword, setVerPassword] = useState(false);

  // Cargos y roles del customer
  const [cargos, setCargos] = useState<Opcion[]>([]);
  const [roles, setRoles] = useState<Opcion[]>([]);
  const [cargandoListas, setCargandoListas] = useState(true);
  const [errorListas, setErrorListas] = useState("");

  useEffect(() => {
    let cancelado = false; // evita setState si el componente se desmontó

    Promise.all([getCustomerJobPositions(), getCustomerRoles()])
      .then(([cargosResp, rolesResp]) => {
        if (cancelado) return;
        const opcionesCargos = aOpciones(cargosResp);
        setCargos(opcionesCargos);
        setRoles(aOpciones(rolesResp));
        opcionesCargadasRef.current?.({ cargos: opcionesCargos });
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error al cargar cargos y roles:", err);
        setErrorListas("No se pudieron cargar los cargos y roles.");
      })
      .finally(() => {
        if (!cancelado) setCargandoListas(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Supervisores: todo el personal del customer,
  // del que tiene más subordinados al que no tiene ninguno
  const [jefes, setJefes] = useState<Opcion[]>([]);
  const [cargandoJefes, setCargandoJefes] = useState(true);

  useEffect(() => {
    let cancelado = false;

    getSupervisors()
      .then((items) => {
        if (cancelado) return;
        const opcionesJefes = aOpcionesJefes(
          items.filter((s) => String(s.id) !== excluirSupervisorId)
        );
        setJefes(opcionesJefes);
        opcionesCargadasRef.current?.({ jefes: opcionesJefes });
      })
      .catch((err) => {
        if (cancelado) return;
        console.error("Error al cargar supervisores:", err);
        // Sin lista no hay a quién asignar: el campo queda opcional (el error solo va a la consola)
      })
      .finally(() => {
        if (!cancelado) setCargandoJefes(false);
      });

    return () => {
      cancelado = true;
    };
  }, [excluirSupervisorId]);

  // Le avisa al padre si hay supervisores (solo cuando la carga terminó bien)
// Le avisa al padre si hay supervisores (cuando termina la carga, con lista o sin ella)
useEffect(() => {
  if (cargandoJefes) return;
  onSupervisoresCargados?.(jefes.length > 0);
}, [cargandoJefes, jefes, onSupervisoresCargados]);

const placeholderJefes = cargandoJefes
  ? "Cargando supervisores..."
  : jefes.length === 0
    ? "No hay supervisores"
    : "Asignar jefe inmediato...";

  const idDe = (campo: keyof FormState) => `${uid}-${campo}`;
  const errorIdDe = (campo: keyof FormState) => `${uid}-${campo}-error`;
  const describedBy = (campo: keyof FormState) =>
    errores[campo] ? errorIdDe(campo) : undefined;

  const campoError = (campo: keyof FormState) =>
    errores[campo] && (
      <span id={errorIdDe(campo)} className={style.errorCampo}>
        {errores[campo]}
      </span>
    );

  const alternarAcceso = (activo: boolean) => {
    if (!activo) setVerPassword(false);
    onAcceso(activo);
  };

  return (
    <>
      <div className={style.columnas}>
        {/* ── Izquierda: Información Personal ── */}
        <section className={style.columna}>
          <h4 className={style.seccion}>Información Personal</h4>
          <div className={style.fila}>
            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idDe("stff_dni")}>
                DNI / Documento
              </label>
              <input
                id={idDe("stff_dni")}
                className={style.input}
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="Número de identidad"
                value={form.stff_dni}
                onChange={(e) => onCambio("stff_dni", e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!errores.stff_dni}
                aria-describedby={describedBy("stff_dni")}
              />
              {campoError("stff_dni")}
            </div>

            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idDe("stff_name")}>
                Nombre(s)
              </label>
              <input
                id={idDe("stff_name")}
                className={style.input}
                type="text"
                placeholder="Ej. Odith Alverto"
                autoFocus
                value={form.stff_name}
                onChange={(e) => onCambio("stff_name", e.target.value)}
                aria-invalid={!!errores.stff_name}
                aria-describedby={describedBy("stff_name")}
              />
              {campoError("stff_name")}
            </div>

            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idDe("stff_lastname")}>
                Apellido(s)
              </label>
              <input
                id={idDe("stff_lastname")}
                className={style.input}
                type="text"
                placeholder="Ej. Dominguez Reymundo"
                value={form.stff_lastname}
                onChange={(e) => onCambio("stff_lastname", e.target.value)}
                aria-invalid={!!errores.stff_lastname}
                aria-describedby={describedBy("stff_lastname")}
              />
              {campoError("stff_lastname")}
            </div>

            <div className={style.campo}>
              <label className={style.etiqueta} htmlFor={idDe("stff_phone")}>
                Teléfono móvil <span>(opcional)</span>
              </label>
              <input
                id={idDe("stff_phone")}
                className={style.input}
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="Ej. 956988798"
                value={form.stff_phone}
                onChange={(e) => onCambio("stff_phone", e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!errores.stff_phone}
                aria-describedby={describedBy("stff_phone")}
              />
              {campoError("stff_phone")}
            </div>
          </div>
        </section>

        {/* ── Derecha: Asignación Laboral ── */}
        <section className={`${style.columna} ${style.columnaDerecha}`}>
          <h4 className={style.seccion}>Asignación Laboral</h4>

          {errorListas && <span className={style.errorCampo}>{errorListas}</span>}

          {/* Cargo */}
          <div className={style.campo}>
            <label className={style.etiqueta} htmlFor={idDe("jb_pstn_cust_id")}>
              Cargo asignado
            </label>
            <Select
              id={idDe("jb_pstn_cust_id")}
              value={form.jb_pstn_cust_id}
              opciones={cargos}
              placeholder={cargandoListas ? "Cargando cargos..." : "Selecciona un cargo"}
              onChange={(v) => onCambio("jb_pstn_cust_id", v)}
              disabled={cargandoListas}
              invalido={!!errores.jb_pstn_cust_id}
              describedBy={describedBy("jb_pstn_cust_id")}
              buscable
              placeholderBusqueda="Buscar cargo..."
            />
            {campoError("jb_pstn_cust_id")}
          </div>

          {/* Jefe directo */}
          <div className={style.campo}>
            <label className={style.etiqueta} htmlFor={idDe("stff_supervisor_id")}>
              Encargado / Jefe Directo
            </label>
            <Select
              id={idDe("stff_supervisor_id")}
              value={form.stff_supervisor_id}
              opciones={jefes}
              placeholder={placeholderJefes}
              onChange={(v) => onCambio("stff_supervisor_id", v)}
              disabled={cargandoJefes || jefes.length === 0}
              invalido={!!errores.stff_supervisor_id}
              describedBy={describedBy("stff_supervisor_id")}
              buscable
              placeholderBusqueda="Buscar personal..."
            />
            
            {campoError("stff_supervisor_id")}
          </div>

          {/* Rol en el sistema (opcional) */}
          <div className={style.campo}>
            <label className={style.etiqueta} htmlFor={idDe("cust_role_id")}>
              Rol en el sistema <span>(opcional)</span>
            </label>
            <Select
              id={idDe("cust_role_id")}
              value={form.cust_role_id}
              opciones={roles}
              placeholder={cargandoListas ? "Cargando roles..." : "Sin rol"}
              onChange={(v) => onCambio("cust_role_id", v)}
              disabled={cargandoListas}
            />
          </div>
        </section>
      </div>

      {/* ── Acceso al Sistema ── */}
      <div className={style.acceso}>
        <label className={style.checkAcceso}>
          <input
            type="checkbox"
            className={style.checkbox}
            checked={conAcceso}
            onChange={(e) => alternarAcceso(e.target.checked)}
          />
          Acceso al Sistema
        </label>

        {conAcceso && (
          <div className={style.accesoCampos}>
            {/* Correo: {dni}@***********.com (el código real lo pone el backend) */}
            <div className={style.campo}>
              <div className={style.inputConIcono}>
                <icon.iconEmail className={style.iconoInputIzquierdo} />
                <input
                  className={`${style.input} ${style.inputBloqueado}`}
                  type="email"
                  value={form.stff_dni ? `${form.stff_dni}@${CODIGO_SISTEMA_OCULTO}.com` : ""}
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                  readOnly
                  tabIndex={-1}
                />
              </div>
            </div>

            <div className={style.campo}>
              <div className={style.inputConIcono}>
                <icon.iconLock className={style.iconoInputIzquierdo} />
                <input
                  id={idDe("stff_password")}
                  className={`${style.input} ${style.inputPassword}`}
                  type={verPassword ? "text" : "password"}
                  placeholder={passwordOpcional ? "Dejar vacío para no cambiarla" : "Contraseña"}
                  aria-label="Contraseña"
                  autoComplete="new-password"
                  value={form.stff_password}
                  onChange={(e) => onCambio("stff_password", e.target.value)}
                  aria-invalid={!!errores.stff_password}
                  aria-describedby={describedBy("stff_password")}
                />
                <button
                  type="button"
                  className={style.botonOjo}
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={verPassword}
                >
                  {verPassword ? (
                    <icon.iconEye className={style.icon} />
                  ) : (
                    <icon.iconEyeOff className={style.icon} />
                  )}
                </button>
              </div>
              {campoError("stff_password")}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Parte1;