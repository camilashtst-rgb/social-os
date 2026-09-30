import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/app'

interface TopbarProps { title: string }

export function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate()
  const { notificationCount, searchQuery, setSearchQuery } = useAppStore()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <header style={{
      height: 56, background: 'var(--white)', borderBottom: '1px solid var(--beige-lt)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, flex: 1, margin: 0 }}>
        {title}
      </h1>
      <span style={{ fontSize: 13, color: 'var(--beige-md)', textTransform: 'capitalize' }}>{today}</span>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar..."
        style={{
          padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6,
          fontSize: 13, background: 'var(--cream)', width: 200,
        }}
      />
      <button
        onClick={() => {}}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}
      >
        🔔
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, background: 'var(--terracotta)',
            color: '#fff', borderRadius: '50%', width: 16, height: 16,
            fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {notificationCount}
          </span>
        )}
      </button>
      <button
        onClick={() => navigate('/conteudos')}
        style={{
          background: 'var(--caramel)', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}
      >
        + Novo Conteúdo
      </button>
    </header>
  )
}
