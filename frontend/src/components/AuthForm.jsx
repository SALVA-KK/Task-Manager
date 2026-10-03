import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorBanner from "./ErrorBanner.jsx";

export default function AuthForm({ title, submitLabel, onSubmit, altText, altLink, altLabel }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = submitLabel === "Sign up";

  const submit = async (e) => {
    e.preventDefault();

    // frontend validation
    const local = {};
    if (!email.trim()) local.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) local.email = "Enter a valid email address.";
    if (!password) local.password = "Password is required.";
    else if (isSignup && password.length < 8) local.password = "Password must be at least 8 characters.";
    setErrors(local);
    setFormError("");
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      await onSubmit(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>{title}</h1>
      <ErrorBanner message={formError} />
      <form onSubmit={submit} noValidate>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <button className="btn primary" disabled={loading}>
          {loading ? "Please wait…" : submitLabel}
        </button>
      </form>
      <p className="muted">
        {altText} <Link to={altLink}>{altLabel}</Link>
      </p>
    </div>
  );
}