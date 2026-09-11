import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CatalogPagination } from './catalog-pagination'
import { visiblePages } from '@/lib/pagination'

describe('paginação', () => {
  it('calcula vizinhas e intervalos', () => { expect(visiblePages(5, 12)).toEqual([0, 'ellipsis', 4, 5, 6, 'ellipsis', 11]); expect(visiblePages(0, 1)).toEqual([0]); expect(visiblePages(0, 0)).toEqual([]); expect(visiblePages(5, 12, true)).toEqual([0, 'ellipsis', 5, 'ellipsis', 11]) })
  it('marca a atual e navega', async () => { const change = vi.fn(); render(<CatalogPagination current={1} total={4} onChange={change} />); expect(screen.getAllByLabelText('Ir para a página 2')[0]).toHaveAttribute('aria-current', 'page'); await userEvent.click(screen.getByRole('button', { name: 'Próxima' })); expect(change).toHaveBeenCalledWith(2) })
  it('desabilita os limites', () => { const { rerender } = render(<CatalogPagination current={0} total={2} onChange={() => undefined} />); expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled(); rerender(<CatalogPagination current={1} total={2} onChange={() => undefined} />); expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled() })
})
