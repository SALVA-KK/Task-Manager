import AuthForm from "../components/AuthForm.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function SignupPage() {
  const { signup } = useAuth();
  return (
    <AuthForm
      title="Create account"
      submitLabel="Sign up"
      onSubmit={signup}
      altText="Already registered?"
      altLink="/login"
      altLabel="Log in"
    />
  );
}