import { Outlet } from "react-router-dom";
// import Sidebar from "../components/layout/Sidebar/sidebar";
// import NavBar from "../components/layout/NavBar/NavBar";

export default function LoginLayout () {
    return (
        <div>  
            
            <Outlet />
            
        </div>
    );
}