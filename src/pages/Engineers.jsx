import { useState, useEffect } from 'react'
import { createBooking, supabase } from '../lib/supabase'
import { IMAGES } from '../lib/images'
import styles from './Engineers.module.css'

const ENGINEERS = [
  { id: 'sara',  photo: IMAGES.engineers.sara,  name: 'Sara Mansour',   role: 'MSc Energy Eng. · Cairo',         rating: 4.9, reviews: 87,  tags: ['Residential PV','Battery systems','Arabic/English'], fee: 'Free with report' },
  { id: 'karim', photo: IMAGES.engineers.karim, name: 'Karim Nasser',   role: 'PE · Off-grid specialist',         rating: 4.8, reviews: 124, tags: ['Off-grid','Hybrid systems','Commercial'],          fee: 'Free with report' },
  { id: 'lena',  photo: IMAGES.engineers.lena,  name: 'Lena Vasquez',   role: 'MEng · Europe & Latin America',   rating: 4.7, reviews: 61,  tags: ['Grid-tied','ROI analysis','Spanish/English'],       fee: 'Free with report' },
  { id: 'david', photo: IMAGES.engineers.david, name: 'David Owusu',    role: 'BEng · Sub-Saharan Africa',        rating: 4.9, reviews: 53,  tags: ['Rural systems','Budget builds','French/English'],   fee: 'Free with report' },
  { id: 'priya', photo: IMAGES.engineers.priya, name: 'Priya Kumar',    role: 'MEng · South & Southeast Asia',   rating: 4.8, reviews: 78,  tags: ['Rooftop PV','Net metering','Hindi/English'],        fee: 'Free with report' },
  { id: 'marco', photo: IMAGES.engineers.marco, name: 'Marco Bianchi',  role: 'PE · Southern Europe',            rating: 4.6, reviews: 42,  tags: ['Grid-tied','BREEAM','Italian/English'],             fee: 'Free with report' },
]

const SLOTS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']
const DEFAULT_TAKEN = ['09:00','12:00','16:00']

export default function Engineers({ user }) {
  const [selected, setSelected] = useState(null)
  const [bookStep, setBookStep] = useState(0) // 0=list 1=date 2=confirm 3=done
  const [selDay, setSelDay] = useState('')
  const [selSlot, setSelSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [takenSlots, setTakenSlots] = useState(DEFAULT_TAKEN)

  // Realtime: subscribe to slot changes for the selected engineer
  useEffect(() => {
    if (!selected) return
    const channel = supabase
      .channel(`slots-${selected.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'engineer_slots',
        filter: `engineer_id=eq.${selected.id}`
      }, (payload) => {
        // If a slot was just booked, add it to taken list
        if (payload.new.booked) {
          setTakenSlots(prev => [...new Set([...prev, payload.new.time])])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected])

  const selectEng = (eng) => { setSelected(eng); setBookStep(1); setSelDay(''); setSelSlot(''); setTakenSlots(DEFAULT_TAKEN) }

  const confirm = async () => {
    setLoading(true)
    if (user) {
      const { data } = await createBooking({
        userId: user.id, engineerId: selected.id, reportId: null,
        date: selDay, time: selSlot, notes
      })
      setBookingRef(data?.[0]?.booking_ref || 'SLR-CONS-' + Date.now().toString(36).toUpperCase())
    } else {
      setBookingRef('SLR-CONS-' + Date.now().toString(36).toUpperCase())
    }
    setLoading(false)
    setBookStep(3)
  }

  const days = [17,18,19,20,23,24,25,26,27,30]

  if (bookStep === 3) return (
    <div className={styles.wrap}>
      <div className={styles.success}>
        <i className="ti ti-circle-check" style={{ fontSize: 42, color: '#27AE60' }} aria-hidden="true" />
        <div className={styles.successTitle}>Booking confirmed!</div>
        <div className={styles.successSub}>A calendar invite and video link have been sent to your email. Your engineer has received your Solarah report.</div>
        <div className={styles.confDetails}>
          <div className={styles.confRow}><span>Engineer</span><span>{selected.name}</span></div>
          <div className={styles.confRow}><span>Date & time</span><span>{new Date().toLocaleString('en', { month: 'long' })} {selDay}, {new Date().getFullYear()} at {selSlot}</span></div>
          <div className={styles.confRow}><span>Format</span><span>Video call · 45 min</span></div>
          <div className={styles.confRow}><span>Booking ref</span><span style={{color:'#F5A623'}}>{bookingRef}</span></div>
        </div>
        <button className="btn-primary" onClick={() => { setBookStep(0); setSelected(null) }}>
          <i className="ti ti-users" aria-hidden="true" /> Browse more engineers
        </button>
      </div>
    </div>
  )

  if (bookStep === 2 && selected) return (
    <div className={styles.wrap}>
      <button className="btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setBookStep(1)}>
        <i className="ti ti-arrow-left" aria-hidden="true" /> Back
      </button>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Confirm your booking</div>
        <div className={styles.confDetails} style={{ marginBottom: '1.25rem' }}>
          <div className={styles.confRow}><span>Engineer</span><span>{selected.name}</span></div>
          <div className={styles.confRow}><span>Date & time</span><span>{new Date().toLocaleString('en', { month: 'long' })} {selDay}, {new Date().getFullYear()} at {selSlot}</span></div>
          <div className={styles.confRow}><span>Format</span><span>Video call · 45 min</span></div>
          <div className={styles.confRow}><span>Fee</span><span style={{ color: '#27AE60' }}>Free with Solarah report</span></div>
        </div>
        <div className="field">
          <label>Notes for your engineer (optional)</label>
          <textarea rows={3} placeholder="e.g. Flat roof, interested in east-west orientation, limited budget..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'none', lineHeight: 1.5 }} />
        </div>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={confirm} disabled={loading}>
          {loading ? 'Confirming...' : <><i className="ti ti-calendar-check" aria-hidden="true" /> Confirm booking</>}
        </button>
      </div>
    </div>
  )

  if (bookStep === 1 && selected) return (
    <div className={styles.wrap}>
      <button className="btn-ghost" style={{ marginBottom: '1rem' }} onClick={() => setBookStep(0)}>
        <i className="ti ti-arrow-left" aria-hidden="true" /> Back to engineers
      </button>
      <div className={styles.card}>
        <div className={styles.engMini}>
          <img className={styles.avatarPhoto} src={selected.photo} alt={selected.name} />
          <div><div className={styles.engName}>{selected.name}</div><div className={styles.engRole}>{selected.role}</div></div>
        </div>
        <div className={styles.cardTitle} style={{ marginBottom: '0.5rem' }}>Pick a date</div>
        <div className={styles.calGrid}>
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} className={styles.calHdr}>{d}</div>)}
          <div className={styles.calEmpty} /><div className={styles.calEmpty} />
          {[17,18,19,20,21,22].map(d => <div key={d} className={`${styles.calDay} ${days.includes(d) ? styles.calAvail : styles.calPast} ${selDay === String(d) ? styles.calSel : ''}`} onClick={() => days.includes(d) && setSelDay(String(d))}>{d}</div>)}
          {[23,24,25,26,27,28,29].map(d => <div key={d} className={`${styles.calDay} ${days.includes(d) ? styles.calAvail : styles.calPast} ${selDay === String(d) ? styles.calSel : ''}`} onClick={() => days.includes(d) && setSelDay(String(d))}>{d}</div>)}
          {[30].map(d => <div key={d} className={`${styles.calDay} ${styles.calAvail} ${selDay === String(d) ? styles.calSel : ''}`} onClick={() => setSelDay(String(d))}>{d}</div>)}
        </div>
        <div className={styles.slotsTitle}>Available times</div>
        <div className={styles.slotsGrid}>
          {SLOTS.map(s => (
            <div key={s} className={`${styles.slot} ${takenSlots.includes(s) ? styles.slotTaken : styles.slotFree} ${selSlot === s ? styles.slotSel : ''}`}
              onClick={() => !takenSlots.includes(s) && setSelSlot(s)}>{s}</div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: selDay && selSlot ? 1 : 0.4 }}
          disabled={!selDay || !selSlot} onClick={() => setBookStep(2)}>
          Review & confirm <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHeader}>
        <div className="section-label">Engineer marketplace</div>
        <h1 className={styles.h1}>Meet our certified engineers</h1>
        <p className={styles.sub}>All engineers are Solarah-verified, globally distributed, and available for virtual consultations. Free with your system report.</p>
      </div>
      <div className={styles.engGrid}>
        {ENGINEERS.map(eng => (
          <div key={eng.id} className={styles.engCard}>
            <img className={styles.engPhoto} src={eng.photo} alt={eng.name} />
            <div className={styles.engCardBody}>
            <div className={styles.engTop}>
              <div>
                <div className={styles.engName}>{eng.name}</div>
                <div className={styles.engRole}>{eng.role}</div>
              </div>
            </div>
            <div className={styles.stars}>{'★'.repeat(Math.floor(eng.rating))}{'☆'.repeat(5 - Math.floor(eng.rating))} <span className={styles.ratingNum}>{eng.rating} · {eng.reviews} consultations</span></div>
            <div className={styles.tags}>{eng.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}</div>
            <div className={styles.fee}>{eng.fee}</div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} onClick={() => selectEng(eng)}>
              <i className="ti ti-calendar" aria-hidden="true" /> Book consultation
            </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
