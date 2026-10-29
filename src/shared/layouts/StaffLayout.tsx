import { Outlet } from "react-router-dom";
import BarraSuperior from "../components/layout/BarraSuperior/BarraSuperior";
import Sidebar from "../components/layout/Sidebar/sidebar";

export default function StaffLayout() {
  return (
    <div >
  
      <Sidebar />

      
        <BarraSuperior/>
        <Outlet />
      
    </div>
  );
}     