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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Zap, Gift } from "lucide-react";
import type { Aposta } from "@/types/betting";
import { motion } from "framer-motion";
import { Edit } from "lucide-react";
import { EditApostaDialog } from "./EditApostaDialog";

interface ApostasTableProps {
  data: Aposta[];
  isLoading?: boolean;
  onReload?: () => void;
}

export function ApostasTable({ data, isLoading, onReload }: ApostasTableProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Aposta | null>(null);
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
          <div className="max-w-[200px]">
            <div className="truncate font-medium" title={row.original.partida || ""}>
              {row.original.partida}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {(row.original.turbo || 0) > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                  <Zap className="h-2.5 w-2.5" />
                  <span>+{((row.original.turbo || 0) * 100).toFixed(0)}%</span>
                </div>
              )}
              {(row.original.bonus || 0) > 0 && (
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-[10px]">
                  <Gift className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
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
      <div className="relative w-full">
        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por partida..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8 sm:pl-10 text-sm"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs sm:text-sm whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead className="text-xs sm:text-sm">
                  Ações
                </TableHead>
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
                    <TableCell key={cell.id} className="text-xs sm:text-sm py-2 sm:py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setSelected(row.original); setEditOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  Nenhuma aposta encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} apostas
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="hidden sm:flex"
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
          <span className="text-xs sm:text-sm px-2">
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
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditApostaDialog
        open={editOpen}
        onOpenChange={(v) => setEditOpen(v)}
        aposta={selected}
        onSuccess={() => {
          if (onReload) onReload();
        }}
      />
    </div>
  );
}
