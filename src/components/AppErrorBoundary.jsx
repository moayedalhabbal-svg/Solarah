import React from 'react'
import i18n from '../i18n'
import { supabase } from '../lib/supabase'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    void supabase.auth.getUser()
      .then(({ data: { user }, error: authError }) => {
        if (authError || !user) return
        return supabase.from('error_logs').insert([{
          user_id: user.id,
          error_type: error instanceof Error ? error.name : 'ReactError',
          message: `Unhandled rendering error at ${window.location.pathname}`,
        }])
      })
      .then(result => {
        if (result?.error) console.warn('Application error log could not be saved')
      })
      .catch(() => console.warn('Application error log could not be saved'))
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main role="alert" style={{ minHeight: '100vh', padding: '4rem 1.5rem', textAlign: 'center', color: '#fff' }}>
        <h1 style={{ color: '#F5A623' }}>{i18n.t('appError.title')}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '1rem 0 2rem' }}>
          {i18n.t('appError.description')}
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          {i18n.t('appError.reload')}
        </button>
      </main>
    )
  }
}
