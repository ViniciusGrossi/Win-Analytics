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
  suggestedQuestions?: string[];
}

export default function Assistente() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "👋 **Olá! Sou seu Assistente de Apostas Inteligente.**\n\nTenho acesso completo ao seu histórico de apostas e posso ajudá-lo com:\n- 📊 Análises detalhadas de performance\n- 🎯 Identificação de padrões e tendências\n- 💡 Estratégias personalizadas\n- 📈 Insights baseados em dados reais\n\nComo posso ajudá-lo hoje?",
      timestamp: new Date(),
      suggestedQuestions: [
        "Analise minha performance geral",
        "Qual minha melhor categoria?",
        "Identifique padrões de risco"
      ]
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

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
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

      // Handle both old format (just reply) and new format (reply + suggestedQuestions)
      const replyContent = data.reply || data.message || "Desculpe, não consegui gerar uma resposta.";
      const suggestions = data.suggestedQuestions || [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
        suggestedQuestions: suggestions
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([messages[0]]); // Keep only the initial message
  };

  return (
    <div className="h-[calc(100vh-100px)] max-w-7xl mx-auto flex flex-col gap-4 p-4">
      {/* Header Compacto */}
      <div className="flex items-center justify-between bg-card p-3 rounded-xl border shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              Wager Art AI
              <Badge variant="secondary" className="text-xs font-normal">Beta</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Assistente Pessoal de Apostas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden md:flex gap-1">
            <Activity className="h-3 w-3" />
            {messages.length} mensagens
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            title="Limpar conversa"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content: Chat + Suggestions */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 overflow-hidden">
        {/* Chat Area - Left Side */}
        <Card className="flex flex-col overflow-hidden border-border/50 shadow-lg">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} w-full`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 ${message.role === "user"
                          ? "bg-primary text-primary-foreground ml-4"
                          : "bg-muted mr-4 relative group"
                        }`}>
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        )}

                        {message.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}

                        <span className={`text-[10px] mt-2 block opacity-70 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Questions Buttons */}
                    {message.role === "assistant" && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-2 mt-3 ml-1 max-w-[85%]"
                      >
                        {message.suggestedQuestions.map((question, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1.5 px-3 bg-background/50 hover:bg-background hover:text-primary border-primary/20 hover:border-primary/50 transition-all text-left whitespace-normal"
                            onClick={() => handleSend(question)}
                            disabled={isLoading}
                          >
                            <Sparkles className="w-3 h-3 mr-1.5 text-primary shrink-0" />
                            {question}
                          </Button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

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
                        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} />
                        <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-card border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta sobre suas apostas..."
                disabled={isLoading}
                className="flex-1 bg-background"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Suggestions Sidebar - Right Side */}
        <div className="hidden lg:flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center gap-2 p-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Sugestões Rápidas</span>
          </div>

          <Tabs defaultValue="Análise" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-3 mb-2 h-9">
              {suggestionCategories.map((cat) => (
                <TabsTrigger key={cat.name} value={cat.name} className="text-xs px-1">
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {suggestionCategories.map((category) => (
              <TabsContent
                key={category.name}
                value={category.name}
                className="flex-1 overflow-hidden mt-0 data-[state=active]:flex flex-col"
              >
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-2 pb-2">
                    {category.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto py-3 px-3 text-left hover:bg-primary/5 hover:border-primary/30 transition-all group whitespace-normal"
                        onClick={() => handleSend(suggestion.text)}
                        disabled={isLoading}
                      >
                        <div className="bg-muted group-hover:bg-background p-2 rounded-md mr-3 transition-colors shrink-0">
                          <suggestion.icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                          {suggestion.text}
                        </span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
