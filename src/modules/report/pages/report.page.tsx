import style from "./report.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

export default function ReportPage() {
  return (
    <div className={style.page}>
      <Seccion_1 />

      <div className={style.row}>
        <Seccion_2 />
        <Seccion_3 />
      </div>
    </div>
  );
}
