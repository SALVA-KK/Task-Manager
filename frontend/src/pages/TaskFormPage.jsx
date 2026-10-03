import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { PRIORITIES, STATUSES } from "../components/constants.js";

const EMPTY = { title: "", description: "", due_date: "", priority: "medium", status: "todo" };

export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // In edit mode, load the existing task to fill the form.
  useEffect(() => {
    if (!isEdit) return;
    api
      .getTask(id)
      .then((task) =>
        setForm({
          title: task.title,
          description: task.description || "",
          due_date: task.due_date || "",
          priority: task.priority,
          status: task.status,
        })
      )
      .catch((err) => setFormError(err.status === 404 ? "Task not found." : err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();

    // frontend validation
    const local = {};
    if (!form.title.trim()) local.title = "Title is required.";
    else if (form.title.length > 200) local.title = "Title must be 200 characters or fewer.";
    setErrors(local);
    setFormError("");
    if (Object.keys(local).length) return;

    const payload = {
      title: form.title.trim(),
      description: form.description,
      due_date: form.due_date || null, // empty date must be null, not ""
      priority: form.priority,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEdit) await api.updateTask(id, payload);
      else await api.createTask(payload);
      navigate("/");
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container narrow">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <h1>{isEdit ? "Edit task" : "New task"}</h1>
      <ErrorBanner message={formError} />
      <form onSubmit={submit} noValidate>
        <label>
          Title *
          <input value={form.title} onChange={setField("title")} maxLength={200} />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Description
          <textarea rows={4} value={form.description} onChange={setField("description")} />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </label>

        <label>
          Due date
          <input type="date" value={form.due_date} onChange={setField("due_date")} />
          {errors.due_date && <span className="field-error">{errors.due_date}</span>}
        </label>

        <div className="row">
          <label>
            Priority
            <select value={form.priority} onChange={setField("priority")}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={setField("status")}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="row">
          <button className="btn primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link className="btn" to="/">Cancel</Link>
        </div>
      </form>
    </div>
  );
}