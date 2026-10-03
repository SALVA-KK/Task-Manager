import { useAuth } from "../AuthContext.jsx";

export default function TaskListPage() {
  const { logout } = useAuth();
  return (
    <div className="container">
      <h1>My Tasks</h1>
      <p className="muted">Logged in. The task list comes in Phase 7.</p>
      <button className="btn" onClick={logout}>Log out</button>
    </div>
  );
}