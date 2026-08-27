import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLanguage } from '../i18n'
import styles from './LanguageSwitcher.module.css'

const LANGS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic',  native: 'العربية' },
]

export default function LanguageSwitcher({ mobile = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  const choose = (code) => {
    setLanguage(code)
    setOpen(false)
  }

  if (mobile) {
    return (
      <div className={styles.mobileWrap}>
        {LANGS.map(l => (
          <button
            key={l.code}
            className={`${styles.mobileOption} ${current.code === l.code ? styles.mobileActive : ''}`}
            onClick={() => choose(l.code)}
          >
            {l.native}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={() => setOpen(o => !o)} aria-label="Change language">
        <i className="ti ti-language" aria-hidden="true" />
        {current.code.toUpperCase()}
      </button>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.menu}>
            {LANGS.map(l => (
              <button
                key={l.code}
                className={`${styles.option} ${current.code === l.code ? styles.active : ''}`}
                onClick={() => choose(l.code)}
              >
                {l.native}
                {current.code === l.code && <i className="ti ti-check" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
