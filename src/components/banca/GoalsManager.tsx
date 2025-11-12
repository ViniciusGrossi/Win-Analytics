import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { goalsService } from "@/services/goals";
import { apostasService } from "@/services/apostas";
import type { Goal } from "@/types/betting";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";

export function GoalsManager() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [monthlyProfit, setMonthlyProfit] = useState(0);
  const [formData, setFormData] = useState({
    daily_goal: 100,
    monthly_goal: 2000,
    loss_limit: 200,
  });

  useEffect(() => {
    loadGoal();
    loadProfits();
  }, []);

  const loadGoal = async () => {
    setIsLoading(true);
    try {
      const data = await goalsService.get();
      if (data) {
        setGoal(data);
        setFormData({
          daily_goal: data.daily_goal || 100,
          monthly_goal: data.monthly_goal || 2000,
          loss_limit: data.loss_limit || 200,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfits = async () => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

      // Lucro diário
      const dailyKpis = await apostasService.kpis({
        startDate: today,
        endDate: today,
      });
      setDailyProfit(dailyKpis.lucro);

      // Lucro mensal
      const monthlyKpis = await apostasService.kpis({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });
      setMonthlyProfit(monthlyKpis.lucro);
    } catch (error) {
      console.error("Erro ao carregar lucros:", error);
    }
  };

  const handleSave = async () => {
    try {
      const updated = await goalsService.upsert(formData);
      setGoal(updated);
      setIsEditing(false);
      toast({ title: "Sucesso", description: "Metas atualizadas com sucesso" });
      await loadProfits();
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar metas", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    if (goal) {
      setFormData({
        daily_goal: goal.daily_goal || 100,
        monthly_goal: goal.monthly_goal || 2000,
        loss_limit: goal.loss_limit || 200,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metas de Lucro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted/50 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Lucro
        </CardTitle>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Label htmlFor="daily_goal" className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Meta Diária
            </Label>
            {isEditing ? (
              <Input
                id="daily_goal"
                type="number"
                value={formData.daily_goal}
                onChange={(e) => setFormData({ ...formData, daily_goal: parseFloat(e.target.value) || 0 })}
                step="10"
                min="0"
              />
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(formData.daily_goal)}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro Hoje:</span>
                    <span className={dailyProfit >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                      {formatCurrency(dailyProfit)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(Math.max((dailyProfit / formData.daily_goal) * 100, 0), 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {dailyProfit >= formData.daily_goal 
                      ? "Meta atingida! 🎉" 
                      : `${((dailyProfit / formData.daily_goal) * 100).toFixed(1)}% da meta`}
                  </p>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <Label htmlFor="monthly_goal" className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              Meta Mensal
            </Label>
            {isEditing ? (
              <Input
                id="monthly_goal"
                type="number"
                value={formData.monthly_goal}
                onChange={(e) => setFormData({ ...formData, monthly_goal: parseFloat(e.target.value) || 0 })}
                step="100"
                min="0"
              />
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(formData.monthly_goal)}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro no Mês:</span>
                    <span className={monthlyProfit >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                      {formatCurrency(monthlyProfit)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(Math.max((monthlyProfit / formData.monthly_goal) * 100, 0), 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {monthlyProfit >= formData.monthly_goal 
                      ? "Meta atingida! 🎉" 
                      : `${((monthlyProfit / formData.monthly_goal) * 100).toFixed(1)}% da meta`}
                  </p>
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <Label htmlFor="loss_limit" className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Limite de Perda Diário
            </Label>
            {isEditing ? (
              <Input
                id="loss_limit"
                type="number"
                value={formData.loss_limit}
                onChange={(e) => setFormData({ ...formData, loss_limit: parseFloat(e.target.value) || 0 })}
                step="10"
                min="0"
              />
            ) : (
              <>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(formData.loss_limit)}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Perda Hoje:</span>
                    <span className={dailyProfit < 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {dailyProfit < 0 ? formatCurrency(Math.abs(dailyProfit)) : "R$ 0,00"}
                    </span>
                  </div>
                  <Progress 
                    value={dailyProfit < 0 
                      ? Math.min((Math.abs(dailyProfit) / formData.loss_limit) * 100, 100)
                      : 0
                    } 
                    className={`h-2 ${dailyProfit < 0 && Math.abs(dailyProfit) >= formData.loss_limit * 0.8 ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"}`}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {dailyProfit >= 0 
                      ? "Sem perdas hoje" 
                      : Math.abs(dailyProfit) >= formData.loss_limit
                        ? "⚠️ Limite atingido!"
                        : `${((Math.abs(dailyProfit) / formData.loss_limit) * 100).toFixed(1)}% do limite`}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
