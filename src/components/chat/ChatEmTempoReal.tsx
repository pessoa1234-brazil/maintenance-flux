import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, MessageCircle } from "lucide-react";

interface Mensagem {
  id: string;
  remetente_id: string;
  mensagem: string;
  created_at: string;
  lida: boolean;
  profiles: {
    full_name: string;
  };
}

interface ChatEmTempoRealProps {
  osId: string;
  destinatarioId: string;
  destinatarioNome: string;
}

export const ChatEmTempoReal = ({ osId, destinatarioId, destinatarioNome }: ChatEmTempoRealProps) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initChat();
  }, [osId]);

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);
    await loadMensagens();
    setupRealtimeSubscription();
  };

  const loadMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select(`
          id,
          remetente_id,
          destinatario_id,
          mensagem,
          created_at,
          lida,
          profiles!mensagens_chat_remetente_id_fkey(full_name)
        `)
        .eq("os_id", osId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMensagens(data as any || []);
      
      // Marcar mensagens recebidas como lidas
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        const naoLidas = data.filter(m => m.destinatario_id === user.id && !m.lida);
        if (naoLidas.length > 0) {
          await supabase
            .from("mensagens_chat")
            .update({ lida: true })
            .in("id", naoLidas.map(m => m.id));
        }
      }

      // Scroll para o final
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${osId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_chat",
          filter: `os_id=eq.${osId}`
        },
        async (payload) => {
          console.log("Nova mensagem recebida:", payload);
          
          // Buscar dados completos da mensagem
          const { data } = await supabase
            .from("mensagens_chat")
            .select(`
              id,
              remetente_id,
              destinatario_id,
              mensagem,
              created_at,
              lida,
              profiles!mensagens_chat_remetente_id_fkey(full_name)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMensagens(prev => [...prev, data as any]);
            
            // Marcar como lida se for para mim
            const { data: { user } } = await supabase.auth.getUser();
            if (user && data.destinatario_id === user.id) {
              await supabase
                .from("mensagens_chat")
                .update({ lida: true })
                .eq("id", data.id);
            }

            // Scroll para o final
            setTimeout(() => {
              scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !userId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("mensagens_chat")
        .insert({
          os_id: osId,
          remetente_id: userId,
          destinatario_id: destinatarioId,
          mensagem: novaMensagem.trim()
        });

      if (error) throw error;
      
      setNovaMensagem("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <CardTitle>Chat com {destinatarioNome}</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            Tempo Real
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {mensagens.map((msg) => {
              const isMe = msg.remetente_id === userId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {msg.profiles.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.profiles.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.mensagem}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending}
            />
            <Button onClick={enviarMensagem} disabled={sending || !novaMensagem.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
