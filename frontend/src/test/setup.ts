import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

Element.prototype.scrollIntoView = () => undefined
// jsdom não implementa rolagem da janela; o roteador volta ao topo a cada página.
window.scrollTo = () => undefined
// Cada teste começa na página inicial.
afterEach(() => { window.history.replaceState(null, '', '/'); delete document.documentElement.dataset.theme; localStorage.clear() })
