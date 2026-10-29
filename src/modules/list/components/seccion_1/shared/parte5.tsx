import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import style from "./modal.module.css";
import { icon } from "../../../../../core/icons";
import type { FormState } from "./parte1";
import type { HorarioState, RefrigerioState } from "./parte2";
import { DIAS_SEMANA, type FeriadoState } from "./parte3";
import type { HonorariosState, TipoPago } from "./parte4";

/* Iconos de `icon` usados en este paso. */
const ICONOS = {
  cargo: icon.iconJobPosition,
  dni: icon.iconDni,
  telefono: icon.iconPhone,
  encargado: icon.iconUser, // solo se usa si todavía no hay encargado elegido
  acceso: icon.iconLock,
};

const ETIQUETA_SUELDO: Record<TipoPago, string> = {
  monthly: "Sueldo mensual",
  weekly: "Sueldo semanal",
  daily: "Sueldo diario",
};

const formatearSueldo = (valor: string) => {
  const n = Number(valor);
  if (!valor || Number.isNaN(n)) return "—";
  return `S/ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* Caja con icono (para las filas que sí llevan icono) */
const CajaIcono = ({ Icono }: { Icono: (props: { className?: string }) => ReactNode }) => (
  <span className={style.resIconoCaja}>
    <Icono className={style.resIcono} />
  </span>
);

/* ───────────── Paso 5: Resumen ───────────── */
interface Parte5Props {
  form: FormState;
  horario: HorarioState;
  refrigerio: RefrigerioState;
  feriado: FeriadoState;
  honorarios: HonorariosState;
  cargoNombre: string;
  jefeNombre: string;
  jefeAvatar: string | null;
  conAcceso: boolean;
  correo: string;
  foto: File | null;
  onFoto: (archivo: File | null) => void;
  /** Edición: foto que ya tiene el personal (se muestra mientras no se elija una nueva). */
  fotoActualUrl?: string | null;
}

const Parte5 = ({
  form,
  horario,
  refrigerio,
  feriado,
  honorarios,
  cargoNombre,
  jefeNombre,
  jefeAvatar,
  conAcceso,
  correo,
  foto,
  onFoto,
  fotoActualUrl = null,
}: Parte5Props) => {
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [fotoNuevaUrl, setFotoUrl] = useState<string | null>(null);
  // La foto nueva tiene prioridad sobre la que ya tenía
  const fotoUrl = fotoNuevaUrl ?? fotoActualUrl;
  const [avatarFallo, setAvatarFallo] = useState(false);

  // Si cambia la URL del encargado, se vuelve a intentar cargarla
  useEffect(() => setAvatarFallo(false), [jefeAvatar]);

  // Vista previa de la foto elegida (se libera la URL al cambiar/desmontar)
  useEffect(() => {
    if (!foto) {
      setFotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setFotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const elegirFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo && archivo.type.startsWith("image/")) onFoto(archivo);
    e.target.value = ""; // permite volver a elegir el mismo archivo
  };

  const textoHorario =
    horario.tipo === "fixed"
      ? `${horario.entrada} a ${horario.salida}`
      : `Flexible · ${horario.horas} horas`;



  const textoRefrigerio =
    refrigerio.tipo === "none"
      ? "Sin refrigerio"
      : refrigerio.tipo === "fixed"
        ? `${refrigerio.inicio} a ${refrigerio.fin}`
        : `Flexible · ${refrigerio.minutos} minutos`;

  const textoFeriados =
    feriado.tipo === "none"
      ? "null"
      : feriado.tipo === "fixed"
        ? feriado.dias.map((d) => DIAS_SEMANA[d]).join(", ")
        : `Flexible · ${feriado.cantidad} por semana`;

  const nombreCompleto = `${form.stff_name.trim()} ${form.stff_lastname.trim()}`;

  /* Encargado: foto → inicial (igual que el paso 1) → icono si aún no hay encargado */
  const visualEncargado: ReactNode =
    jefeAvatar && !avatarFallo ? (
      <img
        src={jefeAvatar}
        alt={jefeNombre}
        className={style.resAvatar}
        onError={() => setAvatarFallo(true)}
      />
    ) : jefeNombre !== "—" ? (
      <span className={`${style.resAvatar} ${style.avatarInicial}`}>
        {jefeNombre.charAt(0).toUpperCase()}
      </span>
    ) : (
      <CajaIcono Icono={ICONOS.encargado} />
    );

  const datosPersonales: { visual: ReactNode; etiqueta: string; valor: string }[] = [
    { visual: <CajaIcono Icono={ICONOS.cargo} />, etiqueta: "Cargo", valor: cargoNombre },
    { visual: <CajaIcono Icono={ICONOS.dni} />, etiqueta: "DNI", valor: form.stff_dni },
    { visual: <CajaIcono Icono={ICONOS.telefono} />, etiqueta: "Número", valor: form.stff_phone || "—" },
    { visual: visualEncargado, etiqueta: "Encargado", valor: jefeNombre },
    { visual: <CajaIcono Icono={ICONOS.acceso} />, etiqueta: "Acceso al sistema", valor: conAcceso ? "Sí" : "No" },
  ];

  const infoLaboral = [
    { etiqueta: "Horario", valor: textoHorario },
    { etiqueta: "Refrigerio", valor: textoRefrigerio },
    { etiqueta: "Días no laborables", valor: textoFeriados },
  ];

  return (
    <div className={style.resumen}>
      {/* ── Tarjeta izquierda: persona ── */}
      <section className={style.resTarjeta}>
        <div className={style.resPerfil}>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={elegirFoto}
          />
          <button
            type="button"
            className={style.resFoto}
            onClick={() => inputFotoRef.current?.click()}
            aria-label={fotoUrl ? "Cambiar foto" : "Subir foto"}
            title={fotoUrl ? "Cambiar foto" : "Subir foto"}
          >
            {fotoUrl ? (
              <img src={fotoUrl} alt={nombreCompleto} className={style.resFotoImg} />
            ) : (
              <icon.iconUploadImage className={style.resFotoIcono} />
            )}
          </button>

          <div className={style.resPerfilTexto}>
            <p className={style.resNombre}>{nombreCompleto}</p>
            <span className={style.resInsignia}>{cargoNombre}</span>
          </div>
        </div>

        <dl className={style.resLista}>
          {datosPersonales.map(({ visual, etiqueta, valor }) => (
            <div key={etiqueta} className={style.resFila}>
              {visual}
              <div>
                <dt className={style.resEtiqueta}>{etiqueta}</dt>
                <dd className={style.resValor}>{valor}</dd>
              </div>
            </div>
          ))}

          {conAcceso && (
            <div className={style.resFila}>
              <CajaIcono Icono={ICONOS.acceso} />
              <div>
                <dt className={style.resEtiqueta}>Correo</dt>
                <dd className={style.resValor}>{correo}</dd>
              </div>
            </div>
          )}
        </dl>
      </section>

      {/* ── Columna derecha ── */}
      <div className={style.resColumna}>
        <section className={style.resTarjeta}>
          <h4 className={style.resTituloTarjeta}>
            <icon.iconCalendar className={style.icon} />
            Información laboral
          </h4>

          <dl className={style.resLaboral}>
            <div className={style.resLaboralIzq}>
              {infoLaboral.map((d) => (
                <div key={d.etiqueta} className={style.resDato}>
                  <dt className={style.resEtiqueta}>{d.etiqueta}</dt>
                  <dd className={style.resValor}>{d.valor}</dd>
                </div>
              ))}
            </div>

          </dl>
        </section>

        <section className={style.resTarjeta}>
          <h4 className={style.resTituloTarjeta}>
            <icon.iconWallet className={style.icon} />
            Honorarios
          </h4>

          <div className={style.resSueldo}>
            <p className={style.resEtiqueta}>{ETIQUETA_SUELDO[honorarios.tipoPago]}</p>
            <p className={style.resSueldoValor}>{formatearSueldo(honorarios.sueldo)}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Parte5;