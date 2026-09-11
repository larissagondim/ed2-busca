import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button-1'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination'
import { visiblePages } from '@/lib/pagination'

export function CatalogPagination({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) {
  const render = (compact: boolean) => visiblePages(current, total, compact).map((page, index) => page === 'ellipsis'
    ? <PaginationItem className={compact ? 'sm:hidden' : 'hidden sm:block'} key={`e-${index}`}><PaginationEllipsis /></PaginationItem>
    : <PaginationItem className={compact ? 'sm:hidden' : 'hidden sm:block'} key={page}><Button variant={page === current ? 'outline' : 'ghost'} mode="icon" size="icon" aria-label={`Ir para a página ${page + 1}`} aria-current={page === current ? 'page' : undefined} onClick={() => onChange(page)}>{page + 1}</Button></PaginationItem>)
  return <Pagination className="py-5"><PaginationContent>
    <PaginationItem><Button variant="ghost" disabled={current === 0} onClick={() => onChange(current - 1)}><ChevronLeft aria-hidden className="size-4" /><span className="hidden sm:inline">Anterior</span></Button></PaginationItem>
    {render(false)}{render(true)}
    <PaginationItem><Button variant="ghost" disabled={current + 1 >= total} onClick={() => onChange(current + 1)}><span className="hidden sm:inline">Próxima</span><ChevronRight aria-hidden className="size-4" /></Button></PaginationItem>
  </PaginationContent></Pagination>
}
