import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar/sidebar";
import BarraSuperior from "../components/layout/BarraSuperior/BarraSuperior";

export default function ejemplo_moduloLayout() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
   
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto" }}>
           <BarraSuperior />
        <Outlet />
      </main>
    </div>
  );
}