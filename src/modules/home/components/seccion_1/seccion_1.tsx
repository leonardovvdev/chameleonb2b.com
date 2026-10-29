// import { useRef } from "react";
import style from "./seccion_1.module.css";
// import type { OrdenInteracciones } from "../../pages/HomePage";




const Seccion_1 = () =>{


  return (
    <div className={style.seccion}>

      <video autoPlay muted loop playsInline>
        <source src="/videos/fondo.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default Seccion_1;