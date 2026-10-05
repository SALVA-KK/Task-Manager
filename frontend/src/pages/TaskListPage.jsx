import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { PRIORITIES, STATUSES } from "../components/constants.js";

const labelOf = (list, value) => list.find((x) => x.value === value)?.label ?? value;

export default function TaskListPage() {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Wait 300ms after typing stops before searching.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTasks(await api.listTasks({ status, search }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const changeStatus = async (task, newStatus) => {
    setBusyId(task.id);
    setError("");
    try {
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setBusyId(task.id);
    setError("");
    try {
      await api.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <header className="topbar">
        <h1>My Tasks</h1>
        <div className="row">
          <Link className="btn primary" to="/tasks/new">+ New task</Link>
          <button className="btn" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by title…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <ErrorBanner message={error} />
      {loading && <p className="muted">Loading tasks…</p>}
      {!loading && !error && tasks.length === 0 && (
        <p className="muted">No tasks found. Create one to get started.</p>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={`task ${task.status === "done" ? "done" : ""}`}>
            <div className="task-main">
              <strong>{task.title}</strong>
              {task.description && <p className="muted">{task.description}</p>}
              <div className="meta">
                <span className={`badge ${task.priority}`}>
                  {labelOf(PRIORITIES, task.priority)}
                </span>
                <span className="muted">Due: {task.due_date || "—"}</span>
              </div>
            </div>
            <div className="task-actions">
              <select
                value={task.status}
                disabled={busyId === task.id}
                onChange={(e) => changeStatus(task, e.target.value)}
                aria-label={`Status for ${task.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {task.status !== "done" && (
                <button
                  className="btn"
                  disabled={busyId === task.id}
                  onClick={() => changeStatus(task, "done")}
                >
                  Mark complete
                </button>
              )}
              <Link className="btn" to={`/tasks/${task.id}/edit`}>Edit</Link>
              <button
                className="btn danger"
                disabled={busyId === task.id}
                onClick={() => removeTask(task)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}