import type React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Variáveis CSS inline (`--i`, `--w`…) sem brigar com o tipo de `style`. */
export const vars = (values: Record<string, string | number>) => values as React.CSSProperties

export const plural = (count: number, one: string, many: string) => `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`
