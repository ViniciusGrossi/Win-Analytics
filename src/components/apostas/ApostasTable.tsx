import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import type { Aposta } from "@/types/betting";
import { motion } from "framer-motion";

interface ApostasTableProps {
  data: Aposta[];
  isLoading?: boolean;
}

export function ApostasTable({ data, isLoading }: ApostasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "data", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<Aposta>[]>(
    () => [
      {
        accessorKey: "data",
        header: "Data",
        cell: ({ row }) => formatDate(row.original.data || ""),
      },
      {
        accessorKey: "partida",
        header: "Partida",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.original.partida || ""}>
            {row.original.partida}
          </div>
        ),
      },
      {
        accessorKey: "casa_de_apostas",
        header: "Casa",
        cell: ({ row }) => (
          <span className="text-xs px-2 py-1 rounded-md bg-secondary/50">
            {row.original.casa_de_apostas}
          </span>
        ),
      },
      {
        accessorKey: "tipo_aposta",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="text-xs">{row.original.tipo_aposta}</span>
        ),
      },
      {
        accessorKey: "odd",
        header: "Odd",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-primary">
            {row.original.odd?.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "valor_apostado",
        header: "Stake",
        cell: ({ row }) => formatCurrency(row.original.valor_apostado || 0),
      },
      {
        accessorKey: "resultado",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={(row.original.resultado || "Pendente") as any} />,
      },
      {
        accessorKey: "valor_final",
        header: "Lucro",
        cell: ({ row }) => {
          const valor = row.original.valor_final || 0;
          return (
            <span className={valor >= 0 ? "text-success" : "text-destructive"}>
              {formatCurrency(valor)}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por partida, detalhes..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhuma aposta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} apostas
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
