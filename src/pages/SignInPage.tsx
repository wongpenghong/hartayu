import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import {
  formatAuthError,
  validatePin,
  validateUsername,
} from "@/auth/member-auth";
import { AuthField, AuthShell } from "@/components/AuthLayout";

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const usernameError = validateUsername(username);
    const pinError = validatePin(pin);
    if (usernameError || pinError) {
      setError(usernameError ?? pinError);
      setSubmitting(false);
      return;
    }

    try {
      await signIn(username, pin);
      navigate("/", { replace: true });
    } catch (caught) {
      setError(formatAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your username and 6-digit PIN."
      footer={
        <p className="text-sm text-slate-400">
          Members are created once via the household seed script.
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          label="Username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={setUsername}
          required
        />
        <AuthField
          label="PIN"
          type="password"
          autoComplete="current-password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={pin}
          onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
          required
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
