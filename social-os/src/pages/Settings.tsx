import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/app'
import type { Settings } from '../types'

export function Settings() {
  const { settings, setSettings } = useAppStore()
  const [form, setForm] = useState<Partial<Settings>>({
    alert_planning_days: 30, alert_production_days: 20,
    alert_approval_days: 10, alert_scheduling_days: 3,
    wip_video_limit: 2, wip_production_limit: 3, wip_approval_limit: 3,
  })

  useEffect(() => {
    if (settings) setForm(settings)
    else {
      supabase.from('settings').select('*').limit(1).single().then(({ data }) => {
        if (data) { setSettings(data as Settings); setForm(data) }
      })
    }
  }, [settings])

  async function save() {
    if (form.id) {
      await supabase.from('settings').update(form).eq('id', form.id)
    } else {
      const { data } = await supabase.from('settings').insert(form).select().single()
      if (data) setSettings(data as Settings)
    }
    supabase.from('settings').select('*').limit(1).single().then(({ data }) => { if (data) setSettings(data as Settings) })
  }

  const numField = (label: string, key: keyof Settings, suffix = 'dias') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" min={1} value={(form[key] as number) ?? 0} onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
          style={{ width: 80, padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <span style={{ fontSize: 13, color: 'var(--beige-md)' }}>{suffix}</span>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 24 }}>Configurações</h2>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--caramel)', marginBottom: 16 }}>Períodos de Alerta</h3>
        {numField('Alerta de planejamento', 'alert_planning_days')}
        {numField('Alerta de produção', 'alert_production_days')}
        {numField('Alerta de aprovação', 'alert_approval_days')}
        {numField('Alerta de agendamento', 'alert_scheduling_days')}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--caramel)', marginBottom: 16 }}>Limites de WIP</h3>
        {numField('Vídeos em produção', 'wip_video_limit', 'vídeos')}
        {numField('Total em produção', 'wip_production_limit', 'conteúdos')}
        {numField('Aguardando aprovação', 'wip_approval_limit', 'conteúdos')}
      </section>

      <button onClick={save} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
        Salvar configurações
      </button>
    </div>
  )
}
