import style from "./register.page.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import Seccion_4 from "../components/seccion_4/seccion_4";
import ModalNuevoRegistro from "../components/seccion_3/shared/modal/modal_nuevo_registro";
import { useRegisterController } from "../controllers/register.controller";

export default function RegisterPage() {
  const register = useRegisterController();

  return (
    <div className={style.page}>
      <Seccion_1 />

      <Seccion_2
        resumen={register.resumen}
        esHoy={register.esHoy}
        cargando={register.cargando}
      />

      <Seccion_3
        filtros={register.filtros}
        onCambiarFiltro={register.actualizarFiltro}
        cargos={register.cargosDisponibles}
        hoy={register.hoy}
        esHoy={register.esHoy}
        onNuevoRegistro={register.nuevoRegistro.abrir}
        onRegistrarAusencia={register.nuevoRegistro.abrirAusencia}
      />
      
      <Seccion_4
        filas={register.filas}
        cargando={register.cargando}
        mensajeError={register.mensajeError}
        resaltados={register.resaltados}
        llaveFiltros={register.llaveFiltros}
        hayFiltrosActivos={register.hayFiltrosActivos}
        esHoy={register.esHoy}
        onActualizarFila={register.actualizarFila}
        onEliminarRegistro={register.eliminarRegistro}
      />

      {register.nuevoRegistro.abierto && <ModalNuevoRegistro control={register.nuevoRegistro} />}
    </div>
  );
}