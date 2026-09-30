import { NavLink } from 'react-router-dom'

const groups = [
  {
    label: 'Principal',
    links: [
      { to: '/', label: 'Início', icon: '⌂' },
      { to: '/meu-dia', label: 'Meu Dia', icon: '☀' },
    ],
  },
  {
    label: 'Produção',
    links: [
      { to: '/conteudos', label: 'Conteúdos', icon: '▤' },
      { to: '/ideias', label: 'Ideias', icon: '◎' },
      { to: '/tarefas', label: 'Tarefas', icon: '✓' },
    ],
  },
  {
    label: 'Planejamento',
    links: [
      { to: '/calendario', label: 'Calendário', icon: '◫' },
      { to: '/radar', label: 'Radar de Datas', icon: '◉' },
    ],
  },
  {
    label: 'Gestão',
    links: [
      { to: '/clientes', label: 'Clientes', icon: '◈' },
      { to: '/configuracoes', label: 'Configurações', icon: '◎' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside style={{
      width: 224,
      minHeight: '100vh',
      background: 'var(--bg)',
      borderRight: '1px solid var(--border)',
      padding: '0',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Social OS
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
          Central de operação
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {groups.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '8px 12px 4px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {group.label}
            </div>
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 12px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--caramel)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--caramel-lt)' : 'transparent',
                  textDecoration: 'none',
                  borderRadius: 7,
                  marginBottom: 1,
                  transition: 'background 0.1s, color 0.1s',
                })}
              >
                <span style={{ fontSize: 13, opacity: 0.8 }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-tertiary)',
      }}>
        v1.0 · Social OS
      </div>
    </aside>
  )
}
