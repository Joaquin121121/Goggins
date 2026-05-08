'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Login({ onSuccess }: { onSuccess: (userId: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.user) {
      setErr(error?.message ?? 'No se pudo iniciar sesión.');
      return;
    }
    onSuccess(data.user.id);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--bg)',
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 18,
          padding: '28px 22px',
          boxShadow: '0 1px 0 rgba(27,24,20,0.02), 0 8px 28px -12px rgba(27,24,20,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 36,
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          Goggins
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--ink-2)',
            marginTop: -8,
            marginBottom: 6,
          }}
        >
          Ingresá para reclamar el del día.
        </div>

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {err && (
          <div
            style={{
              fontSize: 12,
              color: '#C25A4A',
              fontFamily: 'var(--mono)',
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 6,
            padding: '14px 16px',
            background: 'var(--accent)',
            border: 0,
            borderRadius: 12,
            color: '#FFF',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: 0.3,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: 1,
          color: 'var(--ink-2)',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        style={{
          padding: '12px 14px',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          fontSize: 15,
          color: 'var(--ink)',
          outline: 'none',
        }}
      />
    </label>
  );
}
