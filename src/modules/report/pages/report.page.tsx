import style from "./report.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import { useReportController } from "../controllers/report.controller";

export default function ReportPage() {
  const controller = useReportController();

  return (
    <div className={style.page}>
      <Seccion_1 c={controller} />
      <Seccion_2 c={controller} />
    </div>
  );
}