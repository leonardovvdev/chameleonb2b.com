import type { ReportController } from "../../controllers/report.controller";
import style from "./seccion_2.module.css";
import { memo } from "react";

/** "S/ 1,215.42" (los descuentos llegan en negativo y salen como "-S/ 50.00"). */
const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const Seccion_2 = ({ c }: { c: ReportController }) => {
  const sheet = c.activeSheet;
const Fila = memo(
  ({ cells }: { cells: string[] }) => (
    <tr>
      {cells.map((value, i) => (
        <td key={i} className={i > 9 ? style.izquierda : undefined}>
          {value}
        </td>
      ))}
    </tr>
  ),
  (a, b) => a.cells.length === b.cells.length && a.cells.every((v, i) => v === b.cells[i]),
);
  let mensaje: string | null = null;
    if (!c.staff) {
    mensaje = c.initialLoading
      ? "Cargando reporte…"
      : "Selecciona un trabajador para ver su reporte de asistencia.";
  }
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
            <div className={style.filaUnica} style={{ whiteSpace: "pre-line" }}>{sheet.scheduleLine}</div>

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
{sheet.rows.map((cells) => (
  <Fila key={cells[2]} cells={cells} /> // cells[2] = fecha, única por fila
))}
                </tbody>
              </table>
            </div>

            {/* Resumen de pago del mes activo: cambia solo al elegir otro mes o contrato, igual que el Excel. */}
            <div className={style.titulo} style={{ marginTop: 14, fontSize: 14 }}>
              RESUMEN DE PAGO DEL MES
            </div>
            <div className={style.scroll}>
              <table className={style.tabla} style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>CONCEPTO</th>
                    <th>DETALLE</th>
                    <th>MONTO</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.summary.map((line) => (
                    <tr
                      key={line.label}
                      style={line.kind === "total" ? { background: "#eff6ff", fontWeight: 700 } : undefined}
                    >
                      <td className={style.izquierda}>{line.label}</td>
                      <td className={style.izquierda}>{line.detail}</td>
                      <td style={{ textAlign: "right", color: line.amount < 0 ? "#b91c1c" : undefined }}>
                        {soles.format(line.amount)}
                      </td>
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