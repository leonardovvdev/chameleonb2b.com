import { useEffect, useRef, useState } from "react";
import style from "./modal_editar.module.css";
import {
  getCustomerJobPositions,
  getCustomerRoles,
  getSupervisors,
  updateStaff,
  uploadStaffImage,
} from "../../../../../core/services";
import type {
  CustomerJobPosition,
  CustomerRole,
  StaffListItem,
  SupervisorItem,
} from "../../../../../core/types";

const TEXTO_REGEX = /^\p{L}+(?: \p{L}+)*$/u;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

interface FormEditar {
  name: string;
  lastname: string;
  dni: string;
  phone: string;
  cargoId: string;
  rolId: string;
  supervisorId: string;
  conAcceso: boolean;
  password: string;
}

type Errores = Partial<Record<keyof FormEditar, string>>;

const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, "").slice(0, max);

interface ModalEditarProps {
  staff: StaffListItem;
  onActualizado: (cambios: Partial<StaffListItem>) => void;
  onCancelar: () => void;
}

const ModalEditar = ({ staff, onActualizado, onCancelar }: ModalEditarProps) => {
  const [form, setForm] = useState<FormEditar>({
    name: staff.stff_name,
    lastname: staff.stff_lastname,
    dni: staff.stff_dni,
    phone: staff.stff_phone ?? "",
    cargoId: String(staff.cust_jb_pstn_id),
    rolId: staff.cust_role_id ? String(staff.cust_role_id) : "",
    supervisorId: staff.stff_supervisor_id ? String(staff.stff_supervisor_id) : "",
    conAcceso: staff.stff_access_system,
    password: "",
  });
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [cargos, setCargos] = useState<CustomerJobPosition[]>([]);
  const [roles, setRoles] = useState<CustomerRole[]>([]);
  const [supervisores, setSupervisores] = useState<SupervisorItem[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  // El acceso ya existía: la clave se puede dejar vacía para no cambiarla
  const yaTeniaAcceso = staff.stff_access_system;

  useEffect(() => {
    let activo = true;
    Promise.all([getCustomerJobPositions(), getCustomerRoles(), getSupervisors()])
      .then(([cargosData, rolesData, supervisoresData]) => {
        if (!activo) return;
        setCargos(cargosData);
        setRoles(rolesData);
        setSupervisores(supervisoresData);
      })
      .catch((err) => {
        console.error("Error al cargar las opciones:", err);
        if (activo) setErrorGeneral("No se pudieron cargar los cargos, roles y supervisores.");
      })
      .finally(() => activo && setCargandoOpciones(false));
    return () => {
      activo = false;
    };
  }, []);

  const cambiar = <K extends keyof FormEditar>(campo: K, valor: FormEditar[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
    setExito(null);
  };

  const validar = (): Errores => {
    const e: Errores = {};
    const nombre = form.name.trim().replace(/\s+/g, " ");
    const apellido = form.lastname.trim().replace(/\s+/g, " ");

    if (!nombre) e.name = "El nombre es obligatorio.";
    else if (!TEXTO_REGEX.test(nombre)) e.name = "El nombre solo puede contener letras.";

    if (!apellido) e.lastname = "El apellido es obligatorio.";
    else if (!TEXTO_REGEX.test(apellido)) e.lastname = "El apellido solo puede contener letras.";

    if (!/^\d{8}$/.test(form.dni)) e.dni = "El DNI debe tener exactamente 8 dígitos.";
    if (form.phone !== "" && !/^\d{9}$/.test(form.phone))
      e.phone = "El teléfono debe tener exactamente 9 dígitos.";
    if (!form.cargoId) e.cargoId = "Selecciona un cargo.";

    if (form.conAcceso) {
      if (!yaTeniaAcceso && form.password.length < 6)
        e.password = "La contraseña debe tener al menos 6 caracteres.";
      else if (form.password !== "" && form.password.length < 6)
        e.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    return e;
  };

  const guardar = async () => {
    if (guardando) return;
    setErrorGeneral(null);
    setExito(null);

    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    const nombre = form.name.trim().replace(/\s+/g, " ");
    const apellido = form.lastname.trim().replace(/\s+/g, " ");

    setGuardando(true);
    try {
      await updateStaff(staff.stff_id, {
        name: nombre,
        lastname: apellido,
        dni: form.dni,
        phone: form.phone === "" ? null : form.phone,
        jobPositionId: Number(form.cargoId),
        roleId: form.rolId ? Number(form.rolId) : null,
        supervisorId: form.supervisorId ? Number(form.supervisorId) : null,
        withAccess: form.conAcceso,
        password: form.conAcceso && form.password !== "" ? form.password : null,
      });

      onActualizado({
        stff_name: nombre,
        stff_lastname: apellido,
        stff_dni: form.dni,
        stff_phone: form.phone === "" ? null : form.phone,
        cust_jb_pstn_id: Number(form.cargoId),
        job_position_name: cargos.find((c) => String(c.id) === form.cargoId)?.name ?? null,
        cust_role_id: form.rolId ? Number(form.rolId) : null,
        role_name: roles.find((r) => String(r.id) === form.rolId)?.name ?? null,
        stff_supervisor_id: form.supervisorId ? Number(form.supervisorId) : null,
        stff_access_system: form.conAcceso,
      });
      setForm((prev) => ({ ...prev, password: "" }));
      setExito("Cambios guardados.");
    } catch (err) {
      console.error("Error al editar personal:", err);
      setErrorGeneral(
        err instanceof Error && err.message ? err.message : "No se pudo guardar. Intenta de nuevo."
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async (archivo: File | undefined) => {
    if (!archivo) return;
    setErrorFoto(null);

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      setErrorFoto("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
      return;
    }
    if (archivo.size > MAX_IMAGEN_BYTES) {
      setErrorFoto("La imagen no puede pesar más de 5 MB.");
      return;
    }

    setSubiendoFoto(true);
    try {
      const { stff_link_img, img_url } = await uploadStaffImage(staff.stff_id, archivo);
      onActualizado({ stff_link_img, img_url });
    } catch (err) {
      console.error("Error al subir la foto:", err);
      setErrorFoto(err instanceof Error && err.message ? err.message : "No se pudo subir la imagen.");
    } finally {
      setSubiendoFoto(false);
      if (inputFoto.current) inputFoto.current.value = "";
    }
  };

  const opcionesSupervisor = supervisores.filter((s) => s.id !== staff.stff_id);
  const correo = form.dni ? `${form.dni}@(código del sistema).com` : "";

  return (
    <form
      className={style.formulario}
      onSubmit={(e) => {
        e.preventDefault();
        guardar();
      }}
      noValidate
    >
      {/* ── Izquierda: foto ── */}
      <div className={style.columnaFoto}>
        {staff.img_url ? (
          <img className={style.foto} src={staff.img_url} alt={`${staff.stff_name} ${staff.stff_lastname}`} />
        ) : (
          <div className={`${style.foto} ${style.fotoVacia}`} aria-hidden="true" />
        )}

        <input
          ref={inputFoto}
          type="file"
          accept={TIPOS_IMAGEN.join(",")}
          className={style.inputOculto}
          onChange={(e) => cambiarFoto(e.target.files?.[0])}
        />
        <button
          type="button"
          className={style.botonSecundario}
          onClick={() => inputFoto.current?.click()}
          disabled={subiendoFoto}
        >
          {subiendoFoto ? "Subiendo..." : "Cambiar imagen"}
        </button>
        {errorFoto && <p className={style.error}>{errorFoto}</p>}
      </div>

      {/* ── Derecha: datos ── */}
      <div className={style.columnaDatos}>
        {errorGeneral && (
          <p className={style.errorGeneral} role="alert">
            {errorGeneral}
          </p>
        )}
        {exito && <p className={style.exito}>{exito}</p>}

        <div className={style.fila}>
          <label className={style.campo}>
            <span className={style.etiqueta}>Cargo</span>
            <select
              className={style.input}
              value={form.cargoId}
              disabled={cargandoOpciones}
              aria-invalid={!!errores.cargoId}
              onChange={(e) => cambiar("cargoId", e.target.value)}
            >
              <option value="">{cargandoOpciones ? "Cargando..." : "Selecciona un cargo"}</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errores.cargoId && <span className={style.error}>{errores.cargoId}</span>}
          </label>

          <label className={style.campo}>
            <span className={style.etiqueta}>Rol</span>
            <select
              className={style.input}
              value={form.rolId}
              disabled={cargandoOpciones}
              onChange={(e) => cambiar("rolId", e.target.value)}
            >
              <option value="">Sin rol</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={style.fila}>
          <label className={style.campo}>
            <span className={style.etiqueta}>Nombre</span>
            <input
              className={style.input}
              value={form.name}
              aria-invalid={!!errores.name}
              onChange={(e) => cambiar("name", e.target.value)}
            />
            {errores.name && <span className={style.error}>{errores.name}</span>}
          </label>

          <label className={style.campo}>
            <span className={style.etiqueta}>Apellido</span>
            <input
              className={style.input}
              value={form.lastname}
              aria-invalid={!!errores.lastname}
              onChange={(e) => cambiar("lastname", e.target.value)}
            />
            {errores.lastname && <span className={style.error}>{errores.lastname}</span>}
          </label>
        </div>

        <div className={style.fila}>
          <label className={style.campo}>
            <span className={style.etiqueta}>DNI</span>
            <input
              className={style.input}
              inputMode="numeric"
              value={form.dni}
              aria-invalid={!!errores.dni}
              onChange={(e) => cambiar("dni", soloDigitos(e.target.value, 8))}
            />
            {errores.dni && <span className={style.error}>{errores.dni}</span>}
          </label>

          <label className={style.campo}>
            <span className={style.etiqueta}>Teléfono</span>
            <input
              className={style.input}
              inputMode="numeric"
              value={form.phone}
              aria-invalid={!!errores.phone}
              onChange={(e) => cambiar("phone", soloDigitos(e.target.value, 9))}
            />
            {errores.phone && <span className={style.error}>{errores.phone}</span>}
          </label>
        </div>

        <label className={style.campo}>
          <span className={style.etiqueta}>Supervisor</span>
          <select
            className={style.input}
            value={form.supervisorId}
            disabled={cargandoOpciones}
            onChange={(e) => cambiar("supervisorId", e.target.value)}
          >
            <option value="">Sin jefe directo</option>
            {opcionesSupervisor.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.lastname}
                {s.job_position ? ` · ${s.job_position}` : ""}
              </option>
            ))}
          </select>
        </label>

        {/* ── Acceso al sistema ── */}
        <div className={style.acceso}>
          <label className={style.interruptor}>
            <input
              type="checkbox"
              checked={form.conAcceso}
              onChange={(e) => {
                cambiar("conAcceso", e.target.checked);
                if (!e.target.checked) cambiar("password", "");
              }}
            />
            <span>Tiene acceso al sistema</span>
          </label>

          {form.conAcceso && (
            <div className={style.fila}>
              <label className={style.campo}>
                <span className={style.etiqueta}>Correo</span>
                <input className={`${style.input} ${style.inputLectura}`} value={correo} readOnly />
              </label>

              <label className={style.campo}>
                <span className={style.etiqueta}>Contraseña</span>
                <input
                  className={style.input}
                  type="password"
                  autoComplete="new-password"
                  placeholder={yaTeniaAcceso ? "Dejar vacío para no cambiarla" : "Mínimo 6 caracteres"}
                  value={form.password}
                  aria-invalid={!!errores.password}
                  onChange={(e) => cambiar("password", e.target.value)}
                />
                {errores.password && <span className={style.error}>{errores.password}</span>}
              </label>
            </div>
          )}
        </div>

        <div className={style.acciones}>
          <button type="button" className={style.botonSecundario} onClick={onCancelar} disabled={guardando}>
            Volver
          </button>
          <button type="submit" className={style.botonPrimario} disabled={guardando || cargandoOpciones}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ModalEditar;
