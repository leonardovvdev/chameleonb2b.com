import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar/sidebar";
import BarraSuperior from "../components/layout/BarraSuperior/BarraSuperior";

export default function MainLayout() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      
      <Sidebar />

      <main style={{ backgroundColor: "#EFF2F3", flex: 1, minWidth: 0, overflow: "auto", margin: 0, padding: 0 }}>
        <BarraSuperior />
        <Outlet />
      </main>

    </div>
  );
} 