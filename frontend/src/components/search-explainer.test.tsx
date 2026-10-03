import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SearchExplainer } from './search-explainer'

afterEach(() => { cleanup(); vi.useRealTimers() })

describe('SearchExplainer', () => {
  it('executa a busca binária passo a passo', async () => {
    render(<SearchExplainer onUse={() => undefined} />)
    expect(screen.getByRole('tab', { name: /Binária/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Procurar 24, posição 5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText(/Meio do intervalo: 31 > 24/)).toBeInTheDocument(); expect(screen.getByLabelText('1 comparações')).toBeInTheDocument()
    for (let step = 0; step < 3; step++) await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText(/24 = 24. Encontrada/)).toBeInTheDocument(); expect(screen.getByLabelText('4 comparações')).toBeInTheDocument()
  })
  it('reproduz sozinho e guarda a reorganização da lista', () => {
    vi.useFakeTimers()
    render(<SearchExplainer onUse={() => undefined} />)
    fireEvent.click(screen.getByRole('tab', { name: /Mover para o início/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Procurar 19, posição 4' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir' }))
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
    for (let step = 0; step < 6; step++) act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.getByText(/Move 19 para o início/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Procurar 19, posição 1' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar lista' }))
    expect(screen.getByRole('button', { name: 'Procurar 19, posição 4' })).toBeInTheDocument()
  })
  it('mostra chave ausente e repassa a estratégia escolhida', async () => {
    const onUse = vi.fn()
    render(<SearchExplainer onUse={onUse} />)
    await userEvent.click(screen.getByRole('tab', { name: /Lista com saltos/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Procurar chave ausente' }))
    expect(screen.getByText('Chave ausente do catálogo')).toBeInTheDocument()
    for (let step = 0; step < 5; step++) await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText('No nível base, 57 ≠ 50: não está no catálogo.')).toBeInTheDocument(); expect(screen.getByLabelText('5 comparações')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Buscar uma obra com esta busca' })); expect(onUse).toHaveBeenCalledWith('LISTA_COM_SALTOS')
  })
  it('anima a árvore afunilada e guarda a nova forma', async () => {
    render(<SearchExplainer onUse={() => undefined} />)
    await userEvent.click(screen.getByRole('tab', { name: /Árvore afunilada/ }))
    expect(screen.getByText('Reorganiza a árvore')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Procurar 46, profundidade 3' }))
    for (let step = 0; step < 6; step++) await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByRole('button', { name: 'Procurar 46, profundidade 0' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar árvore' }))
    expect(screen.getByRole('button', { name: 'Procurar 46, profundidade 3' })).toBeInTheDocument()
  })
})
