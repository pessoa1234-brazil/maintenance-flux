import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationService = () => {
  useEffect(() => {
    const setupRealtimeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Notificações de novas mensagens no chat
      const chatChannel = supabase
        .channel('chat-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens_chat',
            filter: `destinatario_id=eq.${user.id}`
          },
          (payload) => {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nova Mensagem', {
                body: 'Você recebeu uma nova mensagem no chat',
                icon: '/favicon.ico',
                badge: '/favicon.ico'
              });
            }
            toast.info("Nova mensagem no chat!");
          }
        )
        .subscribe();

      // Notificações de atualizações em OS
      const osChannel = supabase
        .channel('os-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ordens_servico',
            filter: `solicitante_id=eq.${user.id}`
          },
          (payload) => {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Ordem de Serviço Atualizada', {
                body: 'Uma de suas ordens de serviço foi atualizada',
                icon: '/favicon.ico',
                badge: '/favicon.ico'
              });
            }
            toast.info("Sua OS foi atualizada!");
          }
        )
        .subscribe();

      // Notificações de novos orçamentos
      const orcamentoChannel = supabase
        .channel('orcamento-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orcamentos'
          },
          async (payload) => {
            // Verificar se a OS pertence ao usuário
            const { data: os } = await supabase
              .from('ordens_servico')
              .select('solicitante_id')
              .eq('id', payload.new.os_id)
              .single();

            if (os?.solicitante_id === user.id) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo Orçamento', {
                  body: 'Você recebeu um novo orçamento',
                  icon: '/favicon.ico',
                  badge: '/favicon.ico'
                });
              }
              toast.info("Novo orçamento recebido!");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(osChannel);
        supabase.removeChannel(orcamentoChannel);
      };
    };

    setupRealtimeNotifications();
  }, []);

  return null;
};
