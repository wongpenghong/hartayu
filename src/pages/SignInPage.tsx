import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import {
  formatAuthError,
  validatePin,
  validateUsername,
} from "@/auth/member-auth";
import { AuthShell } from "@/components/AuthLayout";
import { ErrorNote, Field, PrimaryAction, TextField } from "@/components/NativeUI";

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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Members are created once via the household seed script.
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label="Username">
          <TextField
            autoComplete="username"
            value={username}
            onChange={setUsername}
            required
          />
        </Field>
        <Field label="PIN">
          <TextField
            type="password"
            autoComplete="current-password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={pin}
            onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        <PrimaryAction type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </PrimaryAction>
      </form>
    </AuthShell>
  );
}
