import { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, DollarSign, User, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

const ROLES = {
  engineer: { label: 'Engineer', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  technician: { label: 'Technician', color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
  permit: { label: 'Permit Office', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  customer: { label: 'Customer', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
};

const TIMELINE = [
  {
    week: 'Week -2',
    phase: 'Design & Approvals',
    items: [
      { id: 't1', title: 'Site Survey & Roof Measurement', role: 'engineer', status: 'done', desc: 'Detailed shading analysis and structural check. Roof span and tilt recorded.' },
      { id: 't2', title: 'System Design & SLD Generation', role: 'engineer', status: 'done', desc: 'Finalizing the Single-Line Diagram and equipment Bill of Materials.' },
      { id: 't3', title: 'Submit Interconnection Application', role: 'permit', status: 'active', desc: 'Submitting paperwork to the utility company and local municipality.', gate: 'STOP: Cannot proceed to installation without Grid Interconnection Approval.' },
    ],
    cost: '10% Engineering Deposit Due'
  },
  {
    week: 'Week -1',
    phase: 'Procurement',
    items: [
      { id: 't4', title: 'Order Panels, Inverter & Battery', role: 'engineer', status: 'pending', desc: 'Placing orders with wholesale suppliers based on final BOM.' },
      { id: 't5', title: 'Delivery to Site', role: 'technician', status: 'pending', desc: 'Offloading and securing equipment at the property. Checking for transport damage.' },
    ],
    cost: '50% Equipment Deposit Due'
  },
  {
    week: 'Week 1',
    phase: 'Installation',
    items: [
      { id: 't6', title: 'Roof Mounting & Rails', role: 'technician', status: 'pending', desc: 'Installing L-feet, EPDM flashing, and leveling aluminum rails.' },
      { id: 't7', title: 'Panel Mounting & Grounding', role: 'technician', status: 'pending', desc: 'Securing PV modules to rails and ensuring continuous grounding across frames.' },
      { id: 't8', title: 'Inverter & Battery Setup', role: 'technician', status: 'pending', desc: 'Mounting inverter to wall and assembling battery racks/modules.' },
    ],
  },
  {
    week: 'Week 2',
    phase: 'Electrical & Commissioning',
    items: [
      { id: 't9', title: 'DC & AC Wiring', role: 'technician', status: 'pending', desc: 'Connecting string homerun cables, MC4s, combiner box, and AC MDB tie-in.' },
      { id: 't10', title: 'Utility Inspection', role: 'permit', status: 'pending', desc: 'Final site inspection by city and utility officials.', gate: 'STOP: Do not power on system before passing inspection and receiving PTO (Permission to Operate).' },
      { id: 't11', title: 'System Commissioning', role: 'engineer', status: 'pending', desc: 'Power-on sequence, firmware updates, Wi-Fi setup, and customer handover walkthrough.' },
    ],
    cost: 'Final 40% Balance Due on Commissioning'
  }
];

function TimelineItem({ item, isActive }) {
  const [expanded, setExpanded] = useState(isActive);
  const role = ROLES[item.role];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 8,
      padding: '1rem',
      position: 'relative',
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 0 15px rgba(59,130,246,0.1)' : 'none'
    }}>
      {/* Connector line dot */}
      <div style={{
        position: 'absolute',
        left: -33,
        top: 24,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: item.status === 'done' ? '#10B981' : item.status === 'active' ? '#3B82F6' : '#4B5563',
        border: '3px solid #0B1F3A',
        zIndex: 2,
        boxShadow: item.status === 'active' ? '0 0 10px #3B82F6' : 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {item.status === 'done' ? <CheckCircle2 size={20} color="#10B981" /> : item.status === 'active' ? <Circle size={20} color="#3B82F6" /> : <Circle size={20} color="#4B5563" />}
          <span style={{ color: 'white', fontWeight: isActive ? 'bold' : 'normal', fontSize: 16 }}>{item.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: role.bg, color: role.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} /> {role.label}
          </div>
          {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.5)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.5)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem', paddingLeft: '2.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1rem 0', fontSize: 14, lineHeight: 1.5 }}>
            {item.desc}
          </p>
          
          {item.gate && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <ShieldAlert size={18} color="#EF4444" style={{ marginTop: 2 }} />
              <span style={{ color: '#EF4444', fontSize: 13, fontWeight: '500' }}>{item.gate}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InstallationSteps({ specs, sector, systemType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: 20 }}>Project Roadmap</h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>End-to-end timeline for your {specs?.systemKW || 5}kWp {systemType || 'Grid-Tied'} system.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#3B82F6', fontSize: 24, fontWeight: 'bold' }}>4 Weeks</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Est. Total Duration</div>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: '1rem' }}>
        {/* Continuous Timeline Vertical Line */}
        <div style={{ position: 'absolute', left: 45, top: 20, bottom: 20, width: 2, background: 'linear-gradient(to bottom, #10B981 0%, #3B82F6 40%, rgba(255,255,255,0.1) 60%)', zIndex: 1 }} />

        {TIMELINE.map((block, index) => (
          <div key={index} style={{ position: 'relative', marginBottom: '3rem', paddingLeft: '4rem' }}>
            
            {/* Week Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h4 style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 'bold', width: '80px' }}>{block.week}</h4>
              <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }}>{block.phase}</span>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {block.items.map(item => (
                <TimelineItem key={item.id} item={item} isActive={item.status === 'active'} />
              ))}
            </div>

            {/* Cost Milestone */}
            {block.cost && (
              <div style={{
                marginTop: '1.5rem',
                background: 'rgba(245,166,35,0.05)',
                border: '1px dashed rgba(245,166,35,0.3)',
                borderRadius: 8,
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,166,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} color="#F5A623" />
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Payment Milestone</div>
                  <div style={{ color: '#F5A623', fontSize: 14, fontWeight: 'bold' }}>{block.cost}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
