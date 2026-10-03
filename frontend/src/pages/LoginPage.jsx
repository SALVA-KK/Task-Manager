import AuthForm from "../components/AuthForm.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      onSubmit={login}
      altText="No account?"
      altLink="/signup"
      altLabel="Sign up"
    />
  );
}