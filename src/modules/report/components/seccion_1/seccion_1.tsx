import { useEffect, useRef } from "react";
import type { ReportController } from "../../controllers/report.controller";
import type { StaffOption } from "../../types/report.types";
import style from "./seccion_1.module.css";

const fullName = (s: StaffOption) => `${s.stff_lastname} ${s.stff_name}`;
const initials = (s: StaffOption) => `${s.stff_lastname[0] ?? ""}${s.stff_name[0] ?? ""}`.toUpperCase();

const Avatar = ({ staff }: { staff: StaffOption }) =>
  staff.img_url ? (
    <img className={style.avatar} src={staff.img_url} alt="" loading="lazy" />
  ) : (
    <span className={style.avatar}>{initials(staff)}</span>
  );

const Seccion_1 = ({ c }: { c: ReportController }) => {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera.
  useEffect(() => {
    if (!c.menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) c.setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [c.menuOpen, c]);

  return (
    <div className={style.seccion}>
      <div className={style.selector} ref={wrapRef}>
        <button type="button" className={style.trigger} onClick={() => c.setMenuOpen(!c.menuOpen)} aria-expanded={c.menuOpen}>
          {c.staff ? (
            <>
              <span className={style.nombre}>{fullName(c.staff)}</span>
              <Avatar staff={c.staff} />
            </>
          ) : (
            <span className={style.placeholder}>Seleccionar personal</span>
          )}
          <span className={style.caret} aria-hidden>▾</span>
        </button>

        {c.menuOpen && (
          <div className={style.menu}>
            <input
              className={style.search}
              type="search"
              placeholder="Buscar por nombre o apellido"
              value={c.search}
              onChange={(e) => c.setSearch(e.target.value)}
              autoFocus
            />
            <ul className={style.list}>
              {c.staffLoading && <li className={style.estado}>Cargando personal…</li>}
              {!c.staffLoading && c.staffError && <li className={style.estadoError}>{c.staffError}</li>}
              {!c.staffLoading && !c.staffError && c.staffOptions.length === 0 && (
                <li className={style.estado}>No se encontraron resultados.</li>
              )}
              {!c.staffLoading &&
                c.staffOptions.map((s) => (
                  <li key={s.stff_id}>
                    <button
                      type="button"
                      className={s.stff_id === c.staff?.stff_id ? style.itemActivo : style.item}
                      onClick={() => c.selectStaff(s)}
                    >
                      <span className={style.itemNombre}>{fullName(s)}</span>
                      <Avatar staff={s} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className={style.contratos}>
        {c.staff && c.contractsLoading && <span className={style.estado}>Cargando contratos…</span>}
        {c.staff && !c.contractsLoading && c.contracts.length === 0 && (
          <span className={style.estado}>Este trabajador no tiene contratos registrados.</span>
        )}
        {c.contracts.map((ct) => (
          <button
            key={ct.id}
            type="button"
            className={ct.id === c.contractId ? style.contratoActivo : style.contrato}
            onClick={() => c.selectContract(ct.id)}
          >
            CONTRATO {ct.number}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={style.excel}
        onClick={() => void c.exportExcel()}
        disabled={!c.report || c.exporting || c.reportLoading}
      >
        {c.exporting ? "GENERANDO…" : "DESCARGAR EXCEL"}
      </button>
    </div>
  );
};

export default Seccion_1;