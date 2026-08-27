import { logAffiliateClick } from '../lib/supabase'
import { IMAGES } from '../lib/images'
import styles from './Products.module.css'

const CATEGORIES = [
  {
    id: 'panels', label: 'Solar panels', icon: 'ti-solar-panel', img: IMAGES.panelsClose,
    products: [
      { id: 'jinko-neo',    name: 'Jinko Tiger Neo 400W',      spec: 'Mono PERC · 22.3% efficiency · 25yr warranty', price: '$95–110/unit', badge: 'Best seller', commission: '3%', link: 'https://www.jinkosolar.com', supplier: 'Jinko Solar' },
      { id: 'longi-hi-mo6', name: 'LONGi Hi-MO 6 405W',       spec: 'HPBC cell · 22.8% efficiency · 30yr warranty', price: '$100–115/unit', badge: 'Premium',    commission: '3%', link: 'https://www.longi.com',      supplier: 'LONGi'       },
      { id: 'canadian-hiku',name: 'Canadian Solar HiKu6 410W', spec: 'Mono PERC · 21.5% efficiency · 25yr warranty', price: '$88–98/unit',  badge: 'Budget pick', commission: '3%', link: 'https://www.canadiansolar.com', supplier: 'Canadian Solar' },
    ]
  },
  {
    id: 'inverters', label: 'Inverters', icon: 'ti-bolt', img: IMAGES.invertor,
    products: [
      { id: 'growatt-sph5',  name: 'Growatt SPH 5kW Hybrid',    spec: 'Wi-Fi monitoring · Dual MPPT · 10yr warranty',  price: '$850–1,100',  badge: 'Best seller', commission: '3%', link: 'https://www.ginverter.com', supplier: 'Growatt'   },
      { id: 'solis-s6',      name: 'Solis S6-GR1P5K-M',         spec: 'Single phase · 5kW · MPPT 98.4% efficiency',   price: '$700–900',    badge: 'Budget pick', commission: '3%', link: 'https://www.solisinverters.com', supplier: 'Solis' },
      { id: 'sungrow-sh10',  name: 'Sungrow SH10RT Hybrid',     spec: '10kW · Three phase · AI-powered EMS',          price: '$1,400–1,800',badge: 'Premium',    commission: '3%', link: 'https://www.sungrowpower.com', supplier: 'Sungrow' },
    ]
  },
  {
    id: 'batteries', label: 'Battery systems', icon: 'ti-battery-charging', img: IMAGES.battery,
    products: [
      { id: 'byd-hvm',     name: 'BYD Battery-Box HVM 8.3kWh', spec: 'LFP · Modular · 10yr warranty · IP55',           price: '$3,200–3,800', badge: 'Best seller', commission: '3%', link: 'https://www.bydbatterybox.com', supplier: 'BYD'      },
      { id: 'pylontech',   name: 'Pylontech US3000C 3.5kWh',   spec: 'LFP · Stackable · 10yr warranty · IP20',         price: '$1,100–1,400', badge: 'Budget pick', commission: '3%', link: 'https://www.pylontech.com.cn',  supplier: 'Pylontech' },
      { id: 'tesla-pw2',   name: 'Tesla Powerwall 2 13.5kWh',  spec: 'Li-ion · Integrated inverter · 10yr warranty',   price: '$9,200–10,500',badge: 'Premium',    commission: '2%', link: 'https://www.tesla.com/powerwall', supplier: 'Tesla'   },
    ]
  },
]

const BADGE_COLORS = {
  'Best seller': { bg: 'rgba(245,166,35,0.15)', color: '#F5A623', border: 'rgba(245,166,35,0.3)' },
  'Premium':     { bg: 'rgba(99,102,241,0.15)', color: '#818CF8', border: 'rgba(99,102,241,0.3)' },
  'Budget pick': { bg: 'rgba(39,174,96,0.12)',  color: '#27AE60', border: 'rgba(39,174,96,0.3)'  },
}

export default function Products({ user }) {
  const handleBuy = (product, categoryId) => {
    logAffiliateClick({
      userId: user?.id,
      productId: product.id,
      productName: product.name,
      supplier: product.supplier,
    })
    window.open(product.link, '_blank')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHeader}>
        <div className="section-label">Product marketplace</div>
        <h1 className={styles.h1}>Recommended components</h1>
        <p className={styles.sub}>Hand-picked, globally available solar components. Solarah earns a small commission on purchases — always at no extra cost to you.</p>
        <div className={styles.commBadge}>
          <i className="ti ti-info-circle" aria-hidden="true" />
          Transparent affiliate model · 2–3% commission · No paid placements — rankings are based on specs only
        </div>
      </div>

      {CATEGORIES.map(cat => (
        <section key={cat.id} className={styles.section}>
          <div className={styles.catHeader}>
            <img src={cat.img} alt="" className={styles.catImg} />
            <div className={styles.catHeaderText}>
              <i className={`ti ${cat.icon}`} aria-hidden="true" style={{ color: '#F5A623', fontSize: 20 }} />
              <h2 className={styles.catTitle}>{cat.label}</h2>
            </div>
          </div>
          <div className={styles.productGrid}>
            {cat.products.map(p => {
              const bc = BADGE_COLORS[p.badge] || BADGE_COLORS['Best seller']
              return (
                <div key={p.id} className={styles.productCard}>
                  <img src={cat.img} alt={p.name} className={styles.productImg} />
                  <div className={styles.productBody}>
                  <div className={styles.cardTop}>
                    <span className={styles.badge} style={{ background: bc.bg, color: bc.color, border: `0.5px solid ${bc.border}` }}>
                      {p.badge}
                    </span>
                  </div>
                  <div className={styles.productName}>{p.name}</div>
                  <div className={styles.productSpec}>{p.spec}</div>
                  <div className={styles.productMeta}>
                    <div className={styles.price}>{p.price}</div>
                    <div className={styles.commLabel}>Comm: {p.commission}</div>
                  </div>
                  <button className={styles.buyBtn} onClick={() => handleBuy(p, cat.id)}>
                    <i className="ti ti-external-link" aria-hidden="true" /> Buy from {p.supplier} ↗
                  </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className={styles.disclaimer}>
        <i className="ti ti-shield-check" aria-hidden="true" style={{ color: '#27AE60', fontSize: 16 }} />
        <span>All products are independently selected based on performance, warranty, and global availability. Solarah does not accept paid placements. Commission helps keep the platform free.</span>
      </div>
    </div>
  )
}
