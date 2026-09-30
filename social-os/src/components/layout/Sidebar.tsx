import { NavLink } from 'react-router-dom'

const groups = [
  {
    label: 'Principal',
    links: [
      { to: '/', label: 'Central de Operação' },
      { to: '/meu-dia', label: 'Meu Dia' },
    ],
  },
  {
    label: 'Produção',
    links: [
      { to: '/conteudos', label: 'Conteúdos' },
      { to: '/ideias', label: 'Ideias' },
      { to: '/tarefas', label: 'Tarefas' },
    ],
  },
  {
    label: 'Planejamento',
    links: [
      { to: '/calendario', label: 'Calendário' },
      { to: '/radar', label: 'Radar de Datas' },
    ],
  },
  {
    label: 'Gestão',
    links: [
      { to: '/clientes', label: 'Clientes' },
      { to: '/configuracoes', label: 'Configurações' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: 'var(--charcoal)', color: 'var(--white)',
      padding: '24px 0', flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 24px', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
        Social OS
      </div>
      {groups.map((group) => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <div style={{ padding: '0 20px 8px', fontSize: 10, fontWeight: 600, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {group.label}
          </div>
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'block', padding: '8px 20px', fontSize: 14,
                color: isActive ? 'var(--caramel)' : 'var(--beige-lt)',
                background: isActive ? 'rgba(163,129,94,0.12)' : 'transparent',
                textDecoration: 'none', borderLeft: isActive ? '2px solid var(--caramel)' : '2px solid transparent',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  )
}
