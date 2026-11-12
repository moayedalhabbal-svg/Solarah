import { useTranslation } from 'react-i18next'

export default function BatterySizingNote({ specs }) {
  const { t } = useTranslation()
  if (!specs?.batteryCapped) return null

  return (
    <div role="note" style={{
      marginTop: 10,
      padding: '10px 12px',
      borderRadius: 8,
      color: '#F5A623',
      background: 'rgba(245,166,35,0.08)',
      border: '1px solid rgba(245,166,35,0.25)',
      fontSize: 13,
    }}>
      {t('batterySizingNote')}
    </div>
  )
}
