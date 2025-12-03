import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { ResultadoType } from "@/types/betting";

interface AnalysisFiltersProps {
  startDate: string;
  endDate: string;
  casa: string;
  resultado: string;
  mercado: string;
  oddMin: string;
  oddMax: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onCasaChange: (casa: string) => void;
  onResultadoChange: (resultado: string) => void;
  onMercadoChange: (mercado: string) => void;
  onOddMinChange: (oddMin: string) => void;
  onOddMaxChange: (oddMax: string) => void;
  onClearFilters: () => void;
  casasDisponiveis: string[];
  mercadosDisponiveis: string[];
}

const resultadoOptions: Array<ResultadoType | "Todos"> = [
  "Todos",
  "Ganhou",
  "Perdeu",
  "Cashout",
  "Pendente",
  "Cancelado",
];

export function AnalysisFilters({
  startDate,
  endDate,
  casa,
  resultado,
  mercado,
  oddMin,
  oddMax,
  onStartDateChange,
  onEndDateChange,
  onCasaChange,
  onResultadoChange,
  onMercadoChange,
  onOddMinChange,
  onOddMaxChange,
  onClearFilters,
  casasDisponiveis,
  mercadosDisponiveis,
}: AnalysisFiltersProps) {
  const hasFilters = startDate || endDate || casa || resultado !== "Todos" || mercado || oddMin || oddMax;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Data Inicial */}
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(new Date(startDate), "PPP", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(date) => onStartDateChange(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Final */}
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(new Date(endDate), "PPP", { locale: ptBR }) : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(date) => onEndDateChange(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Casa de Apostas */}
        <div className="space-y-2">
          <Label>Casa de Apostas</Label>
          <Select value={casa || "Todas"} onValueChange={onCasaChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {casasDisponiveis.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resultado */}
        <div className="space-y-2">
          <Label>Resultado</Label>
          <Select value={resultado || "Todos"} onValueChange={onResultadoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {resultadoOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mercado */}
        <div className="space-y-2">
          <Label>Mercado</Label>
          <Select value={mercado || "Todos"} onValueChange={onMercadoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {mercadosDisponiveis.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Odd Mínima */}
        <div className="space-y-2">
          <Label>Odd Mínima</Label>
          <Input
            type="number"
            step="0.01"
            min="1"
            placeholder="Ex: 1.50"
            value={oddMin}
            onChange={(e) => onOddMinChange(e.target.value)}
          />
        </div>

        {/* Odd Máxima */}
        <div className="space-y-2">
          <Label>Odd Máxima</Label>
          <Input
            type="number"
            step="0.01"
            min="1"
            placeholder="Ex: 5.00"
            value={oddMax}
            onChange={(e) => onOddMaxChange(e.target.value)}
          />
        </div>

        {/* Botão Limpar */}
        <div className="flex items-end">
          {hasFilters && (
            <Button variant="outline" onClick={onClearFilters} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
