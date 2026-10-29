import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import LoginLayout from "../../shared/layouts/LoginLayout";
import HomeLayout from "../../shared/layouts/HomeLayout";

import ProtectedRoute from "../../shared/components/ProtectedRoute";
import { AuthProvider } from "../../core/contexts/auth.context";

import LoginRoutes from "../../modules/login/routes/login.routes";
import HomeRoutes from "../../modules/home/routes/home.routes";
import StaffRoutes from "../../modules/list/routes/list.routes";
import JobpositionRoutes from "../../modules/job-position/routes/job-position.routes";
import AttendanceRoutes from "../../modules/register/routes/register.routes";
import MapRoutes from "../../modules/map/routes/map.routes";
// import ExtensionRoutes from "../../modules/extension/routes/ExtensionRoutes";
import Ejemplo_moduloRoutes from "../../modules/ejemplo_modulo/routes/Ejemplo_moduloRoutes";
import RoleRoutes from "../../modules/role/routes/role.routes";
import Organizational_chartRoutes from "../../modules/organizational-chart/routes/organizational-chart.routes";
import LogoRoutes from "../../modules/storage/routes/storage.routes";
import CalendarRoutes from "../../modules/calendar/routes/calendar.routes";
import ReportsRoutes from "../../modules/report/routes/report.routes";
import ExcelRoutes from "../../modules/excel/routes/excel.routes";
import FotocheckRoutes from "../../modules/fotocheck/routes/fotocheck.routes";


export default function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    {/* ==================== PÚBLICO ==================== */}

                    <Route element={<HomeLayout />}>
                        {HomeRoutes}
                    </Route>
                    <Route element={<LoginLayout />}>
                        {LoginRoutes}
                    </Route>


                    {/* ==================== PROTEGIDO ==================== */}

                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            {StaffRoutes}
                            {JobpositionRoutes}
                            {AttendanceRoutes}
                            {MapRoutes}
                            {/* {ExtensionRoutes} */}
                            {Ejemplo_moduloRoutes}
                            {RoleRoutes}
                            {Organizational_chartRoutes}
                            {FotocheckRoutes}
                            {LogoRoutes}                          
                            {CalendarRoutes}
                            {ReportsRoutes}              
                            {ExcelRoutes}
                    
                        </Route>
                    </Route>

             
               


                    {/* ==================== RUTA POR DEFECTO ==================== */}

                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />


                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}