import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp, signInWithGoogle, resetPassword } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Auth({ onAuth }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.email || (!form.password && mode !== 'forgot')) { setError('Please fill in all fields.'); return }
    setLoading(true); setError(''); setSuccessMsg('')

    if (mode === 'forgot') {
      const { error: err } = await resetPassword(form.email)
      setLoading(false)
      if (err) { setError(err.message); return }
      setSuccessMsg('Password reset link sent! Check your inbox.')
      return
    }

    const { data, error: err } = mode === 'signin'
      ? await signIn(form.email, form.password)
      : await signUp(form.email, form.password, form.name)
    setLoading(false)
    if (err) { setError(err.message); return }

    // After signup, show email verification screen
    if (mode === 'signup') {
      setMode('verify')
      return
    }

    onAuth(data.user)
    navigate('/dashboard')
  }

  const handleGoogleSignIn = async () => {
    setLoading(true); setError('')
    const { error: err } = await signInWithGoogle()
    setLoading(false)
    if (err) setError(err.message)
    // Redirect is handled by Supabase OAuth — it reloads the page
  }

  // ── Email verification screen ────────────────────────────────────────
  if (mode === 'verify') return (
    <div className={styles.wrap}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <div className={styles.title}>Verify your email</div>
        <div className={styles.sub}>
          We've sent a verification link to <strong style={{ color: '#F5A623' }}>{form.email}</strong>. 
          Click the link in the email to activate your account.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginTop: 12 }}>
          Didn't receive it? Check your spam folder, or try signing up again.
        </div>
        <button className="btn-ghost" style={{ marginTop: 20 }} onClick={() => { setMode('signin'); setError('') }}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> Back to sign in
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Solar<span>ah</span></div>
        <div className={styles.title}>
          {mode === 'signin' ? 'Welcome back' : mode === 'forgot' ? 'Reset your password' : 'Create your account'}
        </div>
        <div className={styles.sub}>
          {mode === 'signin' ? 'Sign in to access your reports and bookings.'
           : mode === 'forgot' ? "Enter your email and we'll send you a reset link."
           : 'Free account — save your reports and book engineers.'}
        </div>

        {/* Google OAuth */}
        {mode !== 'forgot' && (
          <>
            <button className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <div className={styles.divider}><span>or</span></div>
          </>
        )}

        {mode === 'signup' && (
          <div className="field">
            <label>Full name</label>
            <input placeholder="Ahmed Al-Rashid" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        {mode !== 'forgot' && (
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
        )}

        {/* Forgot password link */}
        {mode === 'signin' && (
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <button className="btn-ghost" style={{ fontSize: 12, padding: 0, color: 'rgba(255,255,255,0.4)' }}
              onClick={() => { setMode('forgot'); setError(''); setSuccessMsg('') }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && <div className={styles.error}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}
        {successMsg && <div className={styles.success}><i className="ti ti-circle-check" aria-hidden="true" /> {successMsg}</div>}

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : mode === 'forgot' ? 'Send reset link' : 'Create account'}
        </button>

        <div className={styles.toggle}>
          {mode === 'signin' ? "Don't have an account?" : mode === 'forgot' ? 'Remember your password?' : 'Already have an account?'}
          <button className="btn-ghost" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccessMsg('') }}>
            {mode === 'signin' ? 'Sign up free' : 'Sign in'}
          </button>
        </div>

        <div className={styles.skip}>
          <button className="btn-ghost" onClick={() => navigate('/calculator')}>
            Continue without account →
          </button>
        </div>
      </div>
    </div>
  )
}
