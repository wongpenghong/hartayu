import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { RedirectIfAuthenticated, RequireAuth } from "@/auth/RouteGuards";
import MainLayout from "@/components/MainLayout";
import CategoriesPage from "@/pages/CategoriesPage";
import EntriesPage from "@/pages/EntriesPage";
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
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </AuthProvider>
  );
}
