import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, Send, Sparkles, TrendingUp, Target, AlertCircle,
  Copy, Check, Trash2, BarChart3, Brain, Lightbulb,
  TrendingDown, DollarSign, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Assistente() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 **Olá! Sou seu Assistente de Apostas Inteligente.**\n\nTenho acesso completo ao seu histórico de apostas e posso ajudá-lo com:\n- 📊 Análises detalhadas de performance\n- 🎯 Identificação de padrões e tendências\n- 💡 Estratégias personalizadas\n- 📈 Insights baseados em dados reais\n\nComo posso ajudá-lo hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionCategories = [
    {
      name: "Análise",
      icon: BarChart3,
      suggestions: [
        { icon: TrendingUp, text: "Qual minha melhor categoria?" },
        { icon: DollarSign, text: "Calcule meu ROI mensal" },
        { icon: Activity, text: "Analise minha performance recente" },
        { icon: Target, text: "Quais são meus melhores horários?" },
      ]
    },
    {
      name: "Estratégia",
      icon: Brain,
      suggestions: [
        { icon: Lightbulb, text: "Sugira estratégias de melhoria" },
        { icon: AlertCircle, text: "Identifique padrões de perda" },
        { icon: Sparkles, text: "Dicas para aumentar lucro" },
        { icon: TrendingDown, text: "Como reduzir perdas?" },
      ]
    },
    {
      name: "Performance",
      icon: TrendingUp,
      suggestions: [
        { icon: Target, text: "Compare categorias de apostas" },
        { icon: BarChart3, text: "Estatísticas das últimas 30 apostas" },
        { icon: DollarSign, text: "Qual meu melhor valor de aposta?" },
        { icon: Activity, text: "Análise de bancas" },
      ]
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message: userMessage.content },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Desculpe, não consegui processar sua resposta.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao chamar IA:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ **Erro ao processar solicitação**\n\nOcorreu um problema ao processar sua mensagem. Verifique se:\n- A chave da API está configurada corretamente\n- Sua conexão está estável\n\nTente novamente em alguns instantes.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([messages[0]]);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Assistente IA</h1>
              <p className="text-sm text-muted-foreground">Seu consultor pessoal de apostas inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              {messages.length - 1}
            </Badge>
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Chat + Suggestions */}
      <div className="flex-1 grid grid-cols-[1fr_320px] gap-4 overflow-hidden">
        {/* Chat Area - Left Side */}
        <Card className="flex flex-col overflow-hidden border-border/50 shadow-lg">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 ${message.role === "user"
                          ? "bg-primary text-primary-foreground ml-4"
                          : "bg-muted mr-4 relative group"
                        }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Bot className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-xs font-semibold text-primary">Wager Art AI</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        {message.role === "assistant" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl p-4 mr-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/50 p-4 bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Digite sua pergunta... (Enter para enviar)"
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              💡 Dica: Use Shift+Enter para quebrar linha
            </p>
          </div>
        </Card>

        {/* Suggestions Sidebar - Right Side */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <Card className="flex-1 flex flex-col p-3 border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Sugestões Rápidas</h2>
            </div>
            <Tabs defaultValue="Análise" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 mb-2 h-8 flex-shrink-0">
                {suggestionCategories.map((category) => (
                  <TabsTrigger key={category.name} value={category.name} className="text-xs px-2">
                    <category.icon className="h-3 w-3" />
                  </TabsTrigger>
                ))}
              </TabsList>
              {suggestionCategories.map((category) => (
                <TabsContent key={category.name} value={category.name} className="flex-1 mt-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {category.suggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className="p-2.5 hover:bg-accent hover:border-primary/30 cursor-pointer transition-all duration-200 border-border/50 group"
                            onClick={() => handleSuggestion(suggestion.text)}
                          >
                            <div className="flex items-start gap-2">
                              <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mt-0.5 flex-shrink-0">
                                <suggestion.icon className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-xs font-medium leading-tight flex-1">{suggestion.text}</span>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
