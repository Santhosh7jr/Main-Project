import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Assessment from "./pages/Assessment";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MedicineLibrary from "./pages/MedicineLibrary";
import MedicineDetails from "./pages/MedicineDetails";
import MedicineCompare from "./pages/MedicineCompare";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Protected Application */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/patients"
                element={<Patients />}
              />
              <Route
  path="/medicine-library"
  element={<MedicineLibrary />}
/>

<Route
  path="/medicines/:id"
  element={<MedicineDetails />}
/>

<Route
  path="/medicine-compare"
  element={<MedicineCompare />}
/>
              <Route
                path="/patients/:id"
                element={<PatientDetails />}
              />

              <Route
                path="/assessment"
                element={<Assessment />}
              />

              <Route
                path="/reports"
                element={<Reports />}
              />

              <Route
  path="/profile"
  element={<Profile />}
/>

<Route
  path="/settings"
  element={<Settings />}
/>

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

            </Route>
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;