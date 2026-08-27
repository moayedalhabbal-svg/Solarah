import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IMAGES } from '../lib/images'
import { useReveal } from '../lib/useReveal'
import styles from './Landing.module.css'

function RevealBlock({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`${styles.reveal} ${visible ? styles.revealOn : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const STATS = [
    { val: t('landing.stat1Val'), label: t('landing.stat1Label') },
    { val: t('landing.stat2Val'), label: t('landing.stat2Label') },
    { val: t('landing.stat3Val'), label: t('landing.stat3Label') },
    { val: t('landing.stat4Val'), label: t('landing.stat4Label') },
  ]

  const STEPS = [
    { n: '01', icon: 'ti-home-bolt',        title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { n: '02', icon: 'ti-calculator',       title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { n: '03', icon: 'ti-file-description', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
    { n: '04', icon: 'ti-users',            title: t('landing.step4Title'), desc: t('landing.step4Desc') },
  ]

  const FEATURES = [
    { icon: 'ti-map-pin',       title: t('landing.feat1Title'), desc: t('landing.feat1Desc') },
    { icon: 'ti-shopping-cart', title: t('landing.feat2Title'), desc: t('landing.feat2Desc') },
    { icon: 'ti-chart-line',    title: t('landing.feat3Title'), desc: t('landing.feat3Desc') },
    { icon: 'ti-file-download', title: t('landing.feat4Title'), desc: t('landing.feat4Desc') },
    { icon: 'ti-video',         title: t('landing.feat5Title'), desc: t('landing.feat5Desc') },
    { icon: 'ti-language',      title: t('landing.feat6Title'), desc: t('landing.feat6Desc') },
  ]

  return (
    <div className={styles.page}>
      {/* ── Photographic hero ── */}
      <section className={styles.hero}>
        <img src={IMAGES.heroSolarRoof} alt="" className={styles.heroImg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className="badge"><i className="ti ti-bolt" aria-hidden="true" /> {t('landing.badge')}</div>
          <h1 className={styles.h1}>
            {t('landing.h1Line1')}<br /><em>{t('landing.h1Line2')}</em>
          </h1>
          <p className={styles.heroSub}>{t('landing.heroSub')}</p>
          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary} onClick={() => navigate('/calculator')}>
              <i className="ti ti-solar-panel" aria-hidden="true" /> {t('landing.designBtn')} ↗
            </button>
            <button className={styles.btnGhost} onClick={() => navigate('/engineers')}>
              <i className="ti ti-users" aria-hidden="true" /> {t('landing.meetEngineers')}
            </button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className={styles.statsBar}>
        {STATS.map(s => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statNum}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.wrap}>
        {/* How it works */}
        <RevealBlock>
          <section className={styles.section}>
            <div className="section-label">{t('landing.howItWorksLabel')}</div>
            <h2 className={styles.h2}>{t('landing.howItWorksTitle1')}<br />{t('landing.howItWorksTitle2')}</h2>
            <p className={styles.sectionSub}>{t('landing.howItWorksSub')}</p>
            <div className={styles.stepsGrid}>
              {STEPS.map((s, i) => (
                <RevealBlock key={s.n} delay={i * 80} className={styles.stepWrap}>
                  <div className={styles.step}>
                    <div className={styles.stepNum}>{s.n}</div>
                    <div className={styles.stepIcon}><i className={`ti ${s.icon}`} aria-hidden="true" /></div>
                    <h3 className={styles.stepTitle}>{s.title}</h3>
                    <p className={styles.stepDesc}>{s.desc}</p>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </section>
        </RevealBlock>

        <div className={styles.divider} />

        {/* Photo break */}
        <RevealBlock>
          <div className={styles.photoBreak}>
            <img src={IMAGES.installerWorking} alt="" />
            <div className={styles.photoBreakText}>
              <div className={styles.photoBreakQuote}>"{t('landing.quote')}"</div>
            </div>
          </div>
        </RevealBlock>

        <div className={styles.divider} />

        {/* Features */}
        <RevealBlock>
          <section className={styles.section}>
            <div className="section-label">{t('landing.featuresLabel')}</div>
            <h2 className={styles.h2}>{t('landing.featuresTitle1')}<br />{t('landing.featuresTitle2')}</h2>
            <p className={styles.sectionSub}>{t('landing.featuresSub')}</p>
            <div className={styles.featGrid}>
              {FEATURES.map((f, i) => (
                <RevealBlock key={f.title} delay={i * 60}>
                  <div className={styles.feat}>
                    <i className={`ti ${f.icon}`} aria-hidden="true" style={{ color: '#F5A623', fontSize: 20, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div className={styles.featTitle}>{f.title}</div>
                      <div className={styles.featDesc}>{f.desc}</div>
                    </div>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </section>
        </RevealBlock>
      </div>

      {/* Photographic CTA */}
      <RevealBlock>
        <section className={styles.ctaSection}>
          <img src={IMAGES.ctaSunset} alt="" className={styles.ctaImg} />
          <div className={styles.ctaOverlay} />
          <div className={styles.ctaContent}>
            <div className="badge" style={{ marginBottom: '1rem' }}><i className="ti ti-mail" aria-hidden="true" /> {t('landing.earlyAccess')}</div>
            <h2 className={styles.ctaTitle}>{t('landing.ctaTitle1')}<br /><em>{t('landing.ctaTitle2')}</em></h2>
            <p className={styles.ctaSub}>{t('landing.ctaSub')}</p>
            <button className={styles.btnPrimary} onClick={() => navigate('/waitlist')}>
              <i className="ti ti-mail" aria-hidden="true" /> {t('landing.joinWaitlist')} ↗
            </button>
          </div>
        </section>
      </RevealBlock>
    </div>
  )
}
