import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ResultadoType } from "@/types/betting";

interface ApostasFiltersProps {
  selectedStatus: ResultadoType | "Todos";
  onStatusChange: (status: ResultadoType | "Todos") => void;
  selectedCasa: string;
  onCasaChange: (casa: string) => void;
  casasDisponiveis: string[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoriesAvailable: string[];
  selectedTorneio: string;
  onTorneioChange: (torneio: string) => void;
  torneiosAvailable: string[];
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
}

const statusOptions: Array<ResultadoType | "Todos"> = [
  "Todos",
  "Pendente",
  "Ganhou",
  "Perdeu",
  "Cashout",
  "Cancelado",
];

const periodOptions = [
  { value: "all", label: "Todos os períodos" },
  { value: "today", label: "Hoje" },
  { value: "last7", label: "Últimos 7 dias" },
  { value: "last30", label: "Últimos 30 dias" },
  { value: "custom", label: "Período personalizado" },
];

export function ApostasFilters({
  selectedStatus,
  onStatusChange,
  selectedCasa,
  onCasaChange,
  casasDisponiveis,
  selectedPeriod,
  onPeriodChange,
  selectedCategory,
  onCategoryChange,
  categoriesAvailable,
  selectedTorneio,
  onTorneioChange,
  torneiosAvailable,
  dateRange,
  onDateRangeChange,
}: ApostasFiltersProps) {
  const [showCustomDate, setShowCustomDate] = useState(false);

  const hasFilters =
    selectedStatus !== "Todos" ||
    selectedCasa !== "Todas" ||
    selectedPeriod !== "all" ||
    selectedCategory !== "Todas" ||
    selectedTorneio !== "Todos";

  const clearFilters = () => {
    onStatusChange("Todos");
    onCasaChange("Todas");
    onPeriodChange("all");
    onCategoryChange("Todas");
    onTorneioChange("Todos");
    onDateRangeChange({});
    setShowCustomDate(false);
  };

  const handlePeriodChange = (value: string) => {
    onPeriodChange(value);
    if (value === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      onDateRangeChange({});
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap">
        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Casa de Apostas Filter */}
        <Select value={selectedCasa} onValueChange={onCasaChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Casa de Apostas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as Casas</SelectItem>
            {casasDisponiveis.map((casa) => (
              <SelectItem key={casa} value={casa}>
                {casa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period Filter */}
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        {categoriesAvailable.length > 0 && (
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas Categorias</SelectItem>
              {categoriesAvailable.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Torneio Filter */}
        {torneiosAvailable.length > 0 && (
          <Select value={selectedTorneio} onValueChange={onTorneioChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Torneio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos Torneios</SelectItem>
              {torneiosAvailable.map((torneio) => (
                <SelectItem key={torneio} value={torneio}>
                  {torneio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Custom Date Range */}
      {showCustomDate && (
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Período personalizado:</span>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, "PPP", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, "PPP", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
                  initialFocus
                  disabled={(date) => dateRange.from ? date < dateRange.from : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}
