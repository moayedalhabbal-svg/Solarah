import { useState, useEffect } from 'react'
import { joinWaitlist, getWaitlistCount } from '../lib/supabase'
import styles from './Waitlist.module.css'

export default function Waitlist() {
  const [form, setForm] = useState({ name: '', email: '', country: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(2847)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    getWaitlistCount().then(({ count: c }) => { if (c) setCount(c) })
  }, [])

  const submit = async () => {
    if (!form.name || !form.email) { setError('Please enter your name and email.'); return }
    if (!form.email.includes('@')) { setError('Please enter a valid email.'); return }
    setLoading(true); setError('')
    const { error: err } = await joinWaitlist(form)
    setLoading(false)
    if (err && err.code !== '23505') { // ignore duplicate
      setError('Something went wrong. Please try again.')
      return
    }
    setCount(c => c + 1)
    setDone(true)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <i className="ti ti-sun" aria-hidden="true" style={{ fontSize: 40, color: '#F5A623', marginBottom: 16 }} />
        <h1 className={styles.h1}>Be first to go<br /><em>solar smarter.</em></h1>
        <p className={styles.sub}>Join {count.toLocaleString()}+ people getting early access to Solarah. Free system report included at launch.</p>
      </div>

      {done ? (
        <div className={styles.success}>
          <i className="ti ti-circle-check" style={{ fontSize: 36, color: '#27AE60' }} aria-hidden="true" />
          <div className={styles.successTitle}>You're on the list!</div>
          <div className={styles.successSub}>We'll send your early access link to <strong>{form.email}</strong> when Solarah launches. Welcome aboard, {form.name}!</div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className="field"><label>Your name</label><input placeholder="Ahmed Al-Rashid" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="field"><label>Email address</label><input type="email" placeholder="your@email.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="field">
            <label>Your country</label>
            <select value={form.country} onChange={e => set('country', e.target.value)}>
              <option value="">Select country...</option>
              {['Egypt','Saudi Arabia','UAE','Germany','UK','France','Netherlands','Nigeria','South Africa','Kenya','India','Pakistan','Australia','USA','Canada','Brazil','Mexico','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit} disabled={loading}>
            {loading ? 'Joining...' : <><i className="ti ti-mail" aria-hidden="true" /> Join the waitlist ↗</>}
          </button>
          <div className={styles.privacy}><i className="ti ti-lock" aria-hidden="true" /> No spam. Unsubscribe anytime. Your data is never sold.</div>
        </div>
      )}

      <div className={styles.countBadge}>
        🌍 {count.toLocaleString()} people already joined from 40+ countries
      </div>
    </div>
  )
}
