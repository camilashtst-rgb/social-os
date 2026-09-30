interface Props {
  label: string
  count: number
  color?: string
  onClick?: () => void
}

export function CountCard({ label, count, color = 'var(--caramel)', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-sm)',
        borderTop: `3px solid ${color}`,
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      } : undefined}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 30,
        fontWeight: 800,
        color,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {count}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-tertiary)',
        marginTop: 5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
    </div>
  )
}
