import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/app'

interface TopbarProps { title: string }

export function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate()
  const { notificationCount, searchQuery, setSearchQuery } = useAppStore()
  const today = format(new Date(), "EEE, d 'de' MMM", { locale: ptBR })

  return (
    <header style={{
      height: 56,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 14,
      flexShrink: 0,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        fontWeight: 700,
        flex: 1,
        margin: 0,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h1>

      <span style={{
        fontSize: 12,
        color: 'var(--text-tertiary)',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}>
        {today}
      </span>

      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 13,
          color: 'var(--text-tertiary)',
          pointerEvents: 'none',
        }}>⌕</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar..."
          style={{
            padding: '6px 12px 6px 28px',
            border: '1px solid var(--border)',
            borderRadius: 7,
            fontSize: 13,
            background: 'var(--surface)',
            width: 180,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={() => {}}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 7,
          cursor: 'pointer',
          position: 'relative',
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: 'var(--text-secondary)',
        }}
      >
        🔔
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--terracotta)',
            color: '#fff',
            borderRadius: '50%',
            width: 16,
            height: 16,
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {notificationCount}
          </span>
        )}
      </button>

      <button
        onClick={() => navigate('/conteudos')}
        style={{
          background: 'var(--caramel)',
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          padding: '7px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
        }}
      >
        + Novo Conteúdo
      </button>
    </header>
  )
}
