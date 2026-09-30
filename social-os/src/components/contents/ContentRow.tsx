import { isOverdue } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { PriorityBadge } from '../ui/PriorityBadge'
import type { Content } from '../../types'

interface Props { content: Content; onClick: () => void }

export function ContentRow({ content, onClick }: Props) {
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <td style={{ padding: '11px 14px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
        {isOverdue(content) && (
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--terracotta)', marginRight: 8, verticalAlign: 'middle', marginBottom: 1 }} />
        )}
        {content.title}
      </td>
      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>
        {(content.client as any)?.name}
      </td>
      <td style={{ padding: '11px 14px' }}><StatusPill status={content.status} /></td>
      <td style={{ padding: '11px 14px' }}><PriorityBadge priority={content.priority} /></td>
      <td style={{ padding: '11px 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>
        {content.publication_date ?? '—'}
      </td>
    </tr>
  )
}
