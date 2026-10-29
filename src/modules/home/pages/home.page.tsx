// import { useState } from "react";
import style from "./home.page.module.css"
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

export default function HomePage() {

  return (
    <div className={style.seccion}>
      <Seccion_1 />
      <Seccion_2 />
      <Seccion_3 />
    </div>
  );
}