import { Outlet } from "react-router-dom";
import BarraInferior from "../components/layout/BarraInferior/BarraInferior";

export default function HomeLayout() {
  return (
    <div>

      <main>
        <Outlet />
        <BarraInferior/>
      </main>
      
    </div>
  );
}     