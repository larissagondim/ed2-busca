import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FlowButton } from './flow-button'

describe('FlowButton', () => {
  it('repassa clique e propriedades nativas', async () => { const onClick = vi.fn(); render(<FlowButton text="Comparar buscas" type="submit" onClick={onClick} />); await userEvent.click(screen.getByRole('button', { name: 'Comparar buscas' })); expect(onClick).toHaveBeenCalledOnce(); expect(screen.getByRole('button')).toHaveAttribute('type', 'submit') })
  it('mostra processamento e bloqueia interação', () => { render(<FlowButton loading text="Comparar buscas" />); expect(screen.getByRole('button', { name: 'Comparando…' })).toBeDisabled(); expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true') })
})
