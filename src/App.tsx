import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { RedirectIfAuthenticated, RequireAuth } from "@/auth/RouteGuards";
import MainLayout from "@/components/MainLayout";
import AnalysisPage from "@/pages/AnalysisPage";
import EntriesPage from "@/pages/EntriesPage";
import HomePage from "@/pages/HomePage";
import BudgetPage from "@/pages/BudgetPage";
import MorePage from "@/pages/MorePage";
import PortfolioPage from "@/pages/PortfolioPage";
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
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/categories" element={<Navigate to="/analysis" replace />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/limits" element={<Navigate to="/budget" replace />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </AuthProvider>
  );
}
