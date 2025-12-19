import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FieldProvider } from "./contexts/FieldContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import AuthPage from "./features/auth/AuthPage";
import DrisProjectMapPage from "./features/map/MapPage";
import DrisProjectHealthPage from "./features/health/HealthPage";
import DrisProjectAnalysisPage from "./features/analysis/AnalysisPage";
import DrisProjectFieldDetailPage from "./features/field/FieldDetailPage";

function AppContent() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/dris_project" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dris_project" element={<DrisProjectMapPage />} />
        <Route
          path="/dris_project/field/:fieldId"
          element={<DrisProjectFieldDetailPage />}
        />
        <Route
          path="/dris_project/health/:fieldId"
          element={<DrisProjectHealthPage />}
        />
        <Route
          path="/dris_project/analysis/:fieldId"
          element={<DrisProjectAnalysisPage />}
        />
        <Route path="*" element={<Navigate to="/dris_project" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FieldProvider>
          <Router>
            <AppContent />
          </Router>
        </FieldProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
