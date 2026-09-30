import { isOverdue } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { PriorityBadge } from '../ui/PriorityBadge'
import type { Content } from '../../types'

interface Props { content: Content; onClick: () => void }

export function ContentRow({ content, onClick }: Props) {
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer', borderBottom: '1px solid var(--beige-lt)' }}>
      <td style={{ padding: '10px 12px', fontSize: 14 }}>
        {isOverdue(content) && <span style={{ color: 'var(--terracotta)', marginRight: 6 }}>●</span>}
        {content.title}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--beige-md)' }}>
        {(content.client as any)?.name}
      </td>
      <td style={{ padding: '10px 12px' }}><StatusPill status={content.status} /></td>
      <td style={{ padding: '10px 12px' }}><PriorityBadge priority={content.priority} /></td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--beige-md)' }}>
        {content.publication_date ?? '—'}
      </td>
    </tr>
  )
}
