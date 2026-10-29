// seccion_3.tsx
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import style from "./seccion_3.module.css";
import { icon } from "../../../../core/icons";
import { textoFecha } from "../../controllers/register.controller";
import type { ActualizarFiltro, EstadoFiltro, RegisterFilters } from "../../types/register.types";

interface Seccion3Props {
  filtros: RegisterFilters;
  onCambiarFiltro: ActualizarFiltro;
  /** Nombres de cargo para el desplegable. */
  cargos: string[];
  /** Fecha de hoy (YYYY-MM-DD): es el máximo que se puede elegir. */
  hoy: string;
  esHoy: boolean;
  /** Pendiente: sin esta función el botón queda deshabilitado. */
  onNuevoRegistro?: () => void;
  onRegistrarAusencia?: () => void;
}

const Seccion_3 = ({ filtros, onCambiarFiltro, cargos, hoy, esHoy, onNuevoRegistro, onRegistrarAusencia }: Seccion3Props) => {
  const inputFechaRef = useRef<HTMLInputElement>(null);

  // El <input type="date"> va oculto: la caja de fecha lo abre con showPicker().
  const abrirSelectorDeFecha = () => {
    const input = inputFechaRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus(); // navegadores sin showPicker()
    }
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrirSelectorDeFecha();
    }
  };

  return (
    <div className={style.seccion}>
      {/* Búsqueda */}
      <label className={style.caja}>
        <icon.iconMagnifyingGlass className={style.icon} />
        <input
          type="search"
          className={style.input}
          placeholder="Buscar por nombre, apellido o DNI..."
          value={filtros.busqueda}
          onChange={(e) => onCambiarFiltro("busqueda", e.target.value)}
          aria-label="Buscar por nombre, apellido o DNI"
        />
      </label>

      {/* Cargos */}
      <label className={style.caja}>
        <icon.iconJobPosition className={style.icon} />
        <select
          className={style.select}
          value={filtros.cargo}
          onChange={(e) => onCambiarFiltro("cargo", e.target.value)}
          aria-label="Filtrar por cargo"
        >
          <option value="">Todos los cargos</option>
          {cargos.map((cargo) => (
            <option key={cargo} value={cargo}>
              {cargo}
            </option>
          ))}
        </select>
        <icon.iconArrowDown className={style.icon} />
      </label>

      {/* Estados */}
      <label className={style.caja}>
        <icon.iconClock className={style.icon} />
        <select
          className={style.select}
          value={filtros.estado}
          onChange={(e) => onCambiarFiltro("estado", e.target.value as EstadoFiltro)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="presente">Presente</option>
          <option value="tardanza">Tardanza</option>
          <option value="ausente">Ausente</option>
        </select>
        <icon.iconArrowDown className={style.icon} />
      </label>

      {/* Fecha */}
      <div
        className={style.caja}
        style={{ position: "relative", cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Elegir fecha"
        onClick={abrirSelectorDeFecha}
        onKeyDown={alPresionarTecla}
      >
        <icon.iconCalendar className={style.icon} />
        <span className={style.fecha}>{textoFecha(filtros.fecha, esHoy)}</span>
        <icon.iconArrowDown className={style.icon} />

        <input
          ref={inputFechaRef}
          type="date"
          value={filtros.fecha}
          max={hoy}
          onChange={(e) => {
            if (e.target.value) onCambiarFiltro("fecha", e.target.value);
          }}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 0,
            height: 0,
            padding: 0,
            border: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Acciones */}
      <div className={style.acciones}>
        <button
          type="button"
          className={style.boton}
          onClick={onNuevoRegistro}
          disabled={!onNuevoRegistro}
        >
          <icon.iconPlus className={style.iconPlus} />
          Registrar Jornada
        </button>
        <button
          type="button"
          className={`${style.boton} ${style.botonSecundario}`}
          onClick={onRegistrarAusencia}
          disabled={!onRegistrarAusencia}
        >
          <icon.iconPlus className={style.iconPlusSecundario} />
          Registrar Ausencia
        </button>
      </div>
    </div>
  );
};

export default Seccion_3;
