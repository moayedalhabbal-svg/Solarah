import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Sunora.module.css'

export default function Sunora() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: t('sunora.greeting') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const SUGGESTIONS = [
    t('sunora.suggestion1'),
    t('sunora.suggestion2'),
    t('sunora.suggestion3'),
    t('sunora.suggestion4'),
  ]

  const langName = i18n.language === 'ar' ? 'Arabic' : 'English'
  const SYSTEM_CONTEXT = `You are Sunora, the AI assistant for Solarah — a global renewable energy advisory platform.

What Solarah does:
- Free PV (solar) system calculator: users enter location, energy consumption, and budget, and get a complete system design (panel count, inverter size, battery capacity)
- AI-generated written analysis for every system design
- Downloadable branded PDF reports
- Sun Path Tracker: an interactive solar position tool that shows the sun's path across the sky for any location and date, with real-time altitude, azimuth, sunrise/sunset times, and an hourly intensity chart
- Engineer marketplace: users can book free virtual consultations with certified solar engineers
- Product recommendations: panels, inverters, batteries with direct purchase links (Solarah earns a small affiliate commission)
- Fully global — works for any country/region, not limited to one market
- Free to use; engineer consultations are free with a generated report

IMPORTANT: Always respond in ${langName}, regardless of what language the user writes in.

Your job: answer user questions about solar energy, how Solarah works, help them understand their report results, and guide them toward using the calculator or booking an engineer. Be warm, concise, and genuinely helpful — like a knowledgeable friend, not a corporate bot. Keep answers under 100 words unless the question needs more. If you don't know something specific about their exact system, suggest they check their report or talk to an engineer.`

  const send = async (text) => {
    const userMsg = text ?? input
    if (!userMsg.trim()) return
    setInput('')
    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          stream: true,
          system: SYSTEM_CONTEXT,
          messages: newMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
        })
      })
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      
      setLoading(false) // hide typing indicator once connected
      setMessages(m => [...m, { role: 'assistant', text: '' }]) // add empty bubble
      
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = '', full = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6); if (d === '[DONE]') break
          try {
            const j = JSON.parse(d)
            const textDelta = j.candidates?.[0]?.content?.parts?.[0]?.text
            if (textDelta) {
              full += textDelta
              setMessages(msgs => {
                const arr = [...msgs]
                arr[arr.length - 1] = { ...arr[arr.length - 1], text: full }
                return arr
              })
            }
          } catch { }
        }
      }
    } catch (err) {
      console.error(err)
      setMessages(m => [...m, { role: 'assistant', text: t('sunora.errorMsg') }])
    }
    setLoading(false)
  }

  return (
    <>
      <button
        className={`${styles.bubble} ${open ? styles.bubbleOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Sunora assistant' : 'Open Sunora assistant'}
      >
        {open ? <i className="ti ti-x" aria-hidden="true" /> : <i className="ti ti-sparkles" aria-hidden="true" />}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerIcon}><i className="ti ti-sparkles" aria-hidden="true" /></div>
            <div>
              <div className={styles.headerTitle}>{t('sunora.title')}</div>
              <div className={styles.headerSub}>{t('sunora.subtitle')}</div>
            </div>
          </div>

          <div className={styles.body} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgBot}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className={`${styles.msg} ${styles.msgBot}`}>
                <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
              </div>
            )}
            {messages.length === 1 && (
              <div className={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className={styles.suggestion} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            <input
              placeholder={t('sunora.placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={loading} aria-label="Send message">
              <i className="ti ti-arrow-up" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
