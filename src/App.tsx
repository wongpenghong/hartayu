import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { RedirectIfAuthenticated, RequireAuth } from "@/auth/RouteGuards";
import HomePage from "@/pages/HomePage";
import SettingsPage from "@/pages/SettingsPage";
import SignInPage from "@/pages/SignInPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/sign-in" element={<SignInPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </AuthProvider>
  );
}
