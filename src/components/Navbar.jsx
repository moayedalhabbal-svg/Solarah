import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import styles from './Navbar.module.css'

export default function Navbar({ user, onSignOut }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { path: '/',           label: t('nav.home'),       icon: 'ti-home'          },
    { path: '/calculator', label: t('nav.calculator'), icon: 'ti-calculator'    },
    { path: '/sun-path',   label: t('nav.sunPath'),    icon: 'ti-sun'           },
    { path: '/engineers',  label: t('nav.engineers'),  icon: 'ti-users'         },
    { path: '/products',   label: t('nav.products'),   icon: 'ti-shopping-cart' },
  ]

  const go = (path) => { navigate(path); setMenuOpen(false) }

  return (
    <nav className={styles.nav}>
      <div className={styles.bar}>
        <div className={styles.logo} onClick={() => go('/')}>
          Solar<span>ah</span>
        </div>

        {/* Desktop links */}
        <div className={styles.links}>
          {links.map(l => (
            <button
              key={l.path}
              className={`${styles.link} ${pathname === l.path ? styles.active : ''}`}
              onClick={() => go(l.path)}
            >
              <i className={`ti ${l.icon}`} aria-hidden="true" />
              {l.label}
            </button>
          ))}
        </div>

        {/* Desktop right side */}
        <div className={styles.right}>
          <LanguageSwitcher />
          {user ? (
            <>
              <button className={styles.link} onClick={() => go('/dashboard')}>
                <i className="ti ti-layout-dashboard" aria-hidden="true" /> {t('nav.dashboard')}
              </button>
              <button className={styles.signout} onClick={onSignOut}>{t('nav.signOut')}</button>
            </>
          ) : (
            <>
              <button className={styles.link} onClick={() => go('/login')}>{t('nav.signIn')}</button>
              <button className="btn-primary" onClick={() => go('/calculator')}>
                {t('nav.getReport')} ↗
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <i className={`ti ${menuOpen ? 'ti-x' : 'ti-menu-2'}`} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {links.map(l => (
            <button key={l.path} className={`${styles.mobileLink} ${pathname === l.path ? styles.mobileActive : ''}`} onClick={() => go(l.path)}>
              <i className={`ti ${l.icon}`} aria-hidden="true" /> {l.label}
            </button>
          ))}
          <div className={styles.mobileDivider} />
          <LanguageSwitcher mobile />
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              <button className={styles.mobileLink} onClick={() => go('/dashboard')}>
                <i className="ti ti-layout-dashboard" aria-hidden="true" /> {t('nav.dashboard')}
              </button>
              <button className={styles.mobileLink} onClick={() => { onSignOut(); setMenuOpen(false) }}>
                <i className="ti ti-logout" aria-hidden="true" /> {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <button className={styles.mobileLink} onClick={() => go('/login')}>
                <i className="ti ti-login" aria-hidden="true" /> {t('nav.signIn')}
              </button>
              <button className={styles.mobileCta} onClick={() => go('/calculator')}>
                {t('nav.getReport')} ↗
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
