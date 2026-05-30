import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Diagnoses from './pages/Diagnoses';
import Users from './pages/Users';

function ProtectedLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/diagnoses" element={<Diagnoses />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/patients" replace />} />
      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
