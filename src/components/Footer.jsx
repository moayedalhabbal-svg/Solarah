import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.css'

const SOCIALS = [
  { icon: 'ti-brand-linkedin',  url: 'https://linkedin.com/company/solarah',  label: 'LinkedIn'  },
  { icon: 'ti-brand-instagram', url: 'https://instagram.com/solarah',         label: 'Instagram' },
  { icon: 'ti-brand-x',         url: 'https://x.com/solarah',                 label: 'X'         },
  { icon: 'ti-brand-tiktok',    url: 'https://tiktok.com/@solarah',           label: 'TikTok'    },
]

export default function Footer() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brandCol}>
          <div className={styles.logo}>Solar<span>ah</span></div>
          <p className={styles.tagline}>{t('footer.tagline')}</p>
          <div className={styles.socials}>
            {SOCIALS.map(s => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label={s.label}>
                <i className={`ti ${s.icon}`} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className={styles.linkCol}>
          <div className={styles.colTitle}>{t('footer.product')}</div>
          <button onClick={() => navigate('/calculator')}>{t('nav.calculator')}</button>
          <button onClick={() => navigate('/engineers')}>{t('nav.engineers')}</button>
          <button onClick={() => navigate('/products')}>{t('nav.products')}</button>
        </div>

        <div className={styles.linkCol}>
          <div className={styles.colTitle}>{t('footer.company')}</div>
          <button onClick={() => navigate('/waitlist')}>{t('landing.earlyAccess')}</button>
          <a href="mailto:careers@solarah.com">{t('footer.careers')}</a>
          <a href="mailto:hello@solarah.com">{t('footer.contact')}</a>
        </div>

        <div className={styles.linkCol}>
          <div className={styles.colTitle}>{t('footer.follow')}</div>
          {SOCIALS.map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Solarah. {t('footer.rights')}</span>
        <span className={styles.bottomLinks}>
          <a href="#privacy">{t('footer.privacy')}</a>
          <a href="#terms">{t('footer.terms')}</a>
        </span>
      </div>
    </footer>
  )
}
