import type { ReportController } from "../../controllers/report.controller";
import style from "./seccion_2.module.css";

const Seccion_2 = ({ c }: { c: ReportController }) => {
  const sheet = c.activeSheet;

  let mensaje: string | null = null;
  if (!c.staff) mensaje = "Selecciona un trabajador para ver su reporte de asistencia.";
  else if (c.contractsLoading || c.reportLoading) mensaje = "Cargando reporte…";
  else if (c.reportError) mensaje = c.reportError;
  else if (c.contracts.length === 0) mensaje = "Este trabajador no tiene contratos registrados.";
  else if (!sheet) mensaje = "Este contrato no tiene registros de asistencia.";

  return (
    <div className={style.seccion}>
      {mensaje && <p className={c.reportError ? style.error : style.mensaje}>{mensaje}</p>}

      {!mensaje && sheet && (
        <>
          {c.sheets.length > 1 && (
            <div className={style.meses} role="tablist">
              {c.sheets.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  role="tab"
                  aria-selected={s.name === sheet.name}
                  className={s.name === sheet.name ? style.mesActivo : style.mes}
                  onClick={() => c.setSheetName(s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className={style.documento}>
            <div className={style.titulo}>{sheet.title}</div>
            <div className={style.fila}>
              <span>{sheet.staffLine}</span>
              <span>{sheet.dniLine}</span>
            </div>
            <div className={style.fila}>
              <span>{sheet.startLine}</span>
              <span>{sheet.endLine}</span>
            </div>
            <div className={style.filaUnica}>{sheet.scheduleLine}</div>

            <div className={style.scroll}>
              <table className={style.tabla}>
                <thead>
                  <tr>
                    {sheet.header.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.length === 0 && (
                    <tr>
                      <td colSpan={sheet.header.length} className={style.vacio}>
                        Sin registros en este mes.
                      </td>
                    </tr>
                  )}
                  {sheet.rows.map((cells, r) => (
                    <tr key={r}>
                      {cells.map((value, i) => (
                        <td key={i} className={i > 9 ? style.izquierda : undefined}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Seccion_2;