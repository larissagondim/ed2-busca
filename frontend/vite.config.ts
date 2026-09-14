import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},plugins:[react(),tailwindcss()],server:{proxy:{'/api':'http://localhost:8080'}},test:{include:['src/**/*.test.{ts,tsx}'],environment:'jsdom',setupFiles:'./src/test/setup.ts',coverage:{provider:'v8',reporter:['text','html'],include:['src/**/*.{ts,tsx}'],exclude:['src/main.tsx','src/test/**','src/**/*.test.*','src/components/ui/button-1.tsx'],thresholds:{lines:80,branches:70}}}})
