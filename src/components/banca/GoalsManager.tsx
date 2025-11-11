import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goalsService } from "@/services/goals";
import type { Goal } from "@/types/betting";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Target, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { motion } from "framer-motion";

export function GoalsManager() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    daily_goal: 100,
    monthly_goal: 2000,
    loss_limit: 200,
  });

  useEffect(() => {
    loadGoal();
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

  const handleSave = async () => {
    try {
      const updated = await goalsService.upsert(formData);
      setGoal(updated);
      setIsEditing(false);
      toast({ title: "Sucesso", description: "Metas atualizadas com sucesso" });
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
            className="space-y-2"
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
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(formData.daily_goal)}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
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
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(formData.monthly_goal)}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="loss_limit" className="flex items-center gap-2 text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Limite de Perda
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
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(formData.loss_limit)}
              </p>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
