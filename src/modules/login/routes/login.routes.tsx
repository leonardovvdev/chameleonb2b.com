import { Route } from "react-router-dom";
import LoginPage from "../pages/login.page";
import AuthCallback from "../pages/auth_callback.page";

export default [
    <Route key="login" path="/login" element={<LoginPage />} />,
    <Route key="auth-callback" path="/auth/callback" element={<AuthCallback />} />,
];
