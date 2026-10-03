import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import TaskListPage from "./pages/TaskListPage.jsx";
import TaskFormPage from "./pages/TaskFormPage.jsx";

function Protected({ children }) {
  const { authed } = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { authed } = useAuth();
  return authed ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/" element={<Protected><TaskListPage /></Protected>} />
      <Route path="/tasks/new" element={<Protected><TaskFormPage /></Protected>} />
      <Route path="/tasks/:id/edit" element={<Protected><TaskFormPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}