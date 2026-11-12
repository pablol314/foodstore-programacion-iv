import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  loading: boolean
  error: string | null
  emptyMessage: string
  onRetry: () => void
}

export function DataTable<TData>({ data, columns, loading, error, emptyMessage, onRetry }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  return (
    <section className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm shadow-ink/[0.03]">
      <div className="flex flex-col justify-between gap-3 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:px-5">
        <label className="w-full sm:max-w-sm">
          <span className="sr-only">Búsqueda global</span>
          <input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="field bg-paper" placeholder="Buscar en la tabla…" />
        </label>
        <span className="text-xs text-ink/50">{table.getFilteredRowModel().rows.length} registros</span>
      </div>

      {loading ? (
        <div className="space-y-3 p-5" aria-busy="true" role="status">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-paper" />)}</div>
      ) : error ? (
        <div role="alert" className="m-5 rounded-2xl border border-coral/20 bg-[#f8ece7] p-5 text-sm text-[#9b3f28]">
          <p>No se pudieron cargar los datos. {error}</p>
          <button type="button" onClick={onRetry} className="mt-3 rounded-full border border-current px-4 py-2 text-xs font-bold">Reintentar</button>
        </div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink/55">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-paper/80 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/55">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-b border-ink/10">
                  {group.headers.map((header) => (
                    <th key={header.id} scope="col" className="px-4 py-3.5">
                      {header.isPlaceholder ? null : (
                        <div className="min-w-24">
                          <button
                            type="button"
                            disabled={!header.column.getCanSort()}
                            onClick={header.column.getToggleSortingHandler()}
                            className="text-left disabled:cursor-default"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as 'asc' | 'desc'] ?? ''}
                          </button>
                          {header.column.getCanFilter() && (
                            <input
                              aria-label={`Filtrar ${String(header.column.columnDef.header)}`}
                              value={String(header.column.getFilterValue() ?? '')}
                              onChange={(event) => header.column.setFilterValue(event.target.value)}
                              placeholder="Filtrar…"
                              className="mt-2 w-full rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-[10px] font-medium normal-case tracking-normal text-ink outline-none focus:border-forest"
                            />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-ink/5">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-paper/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle text-ink/75">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && table.getFilteredRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-ink/10 px-4 py-3 sm:px-5">
          <span className="text-xs text-ink/50">Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-bold text-forest disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
            <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-bold text-forest disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </section>
  )
}
