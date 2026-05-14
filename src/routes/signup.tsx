import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "./index";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — TRENA" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/app",
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Bem-vindo ao TRENA 🎯");
    navigate({ to: "/app" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error) toast.error("Falha ao entrar com Google");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo />
          <span className="font-display text-2xl font-bold uppercase">Trena</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="font-display text-2xl font-bold">Crie sua conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">É grátis. Em 60s você já vê seu lucro real.</p>

          <button
            onClick={handleGoogle}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <Field label="Seu nome" type="text" value={fullName} onChange={setFullName} required />
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Senha (mín. 6 caracteres)" type="password" value={password} onChange={setPassword} required />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Criando..." : "Criar conta grátis"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-brand-dark hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, type, value, onChange, required,
}: { label: string; type: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
