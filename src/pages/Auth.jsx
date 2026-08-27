import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Auth({ onAuth }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const { data, error: err } = mode === 'signin'
      ? await signIn(form.email, form.password)
      : await signUp(form.email, form.password, form.name)
    setLoading(false)
    if (err) { setError(err.message); return }
    onAuth(data.user)
    navigate('/dashboard')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Solar<span>ah</span></div>
        <div className={styles.title}>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>
        <div className={styles.sub}>{mode === 'signin' ? 'Sign in to access your reports and bookings.' : 'Free account — save your reports and book engineers.'}</div>

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
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {error && <div className={styles.error}><i className="ti ti-alert-circle" aria-hidden="true" /> {error}</div>}

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <div className={styles.toggle}>
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button className="btn-ghost" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>
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
