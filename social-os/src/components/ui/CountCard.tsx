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
        background: 'var(--white)',
        border: '1px solid var(--beige-lt)',
        borderRadius: 8,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 700,
        color,
        lineHeight: 1,
      }}>
        {count}
      </div>
      <div style={{
        fontSize: 12,
        color: 'var(--beige-md)',
        marginTop: 4,
        fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  )
}
