'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTicketSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítica',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

/**
 * Hook that handles real-time ticket notifications via WebSocket.
 * Use this in the dashboard layout so it stays active across all pages.
 */
export function useTicketNotifications() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const notifiedRef = useRef<Set<string>>(new Set());

  const handleTicketCreated = useCallback(
    (data: any) => {
      const ticket = data?.ticket;
      if (!ticket?.id) return;

      if (notifiedRef.current.has(ticket.id)) return;
      notifiedRef.current.add(ticket.id);

      toast({
        title: `🎫 Nuevo ticket: ${ticket.code}`,
        description: `${ticket.title} — ${ticket.category} · ${PRIORITY_LABELS[ticket.priority] || ticket.priority} · por ${ticket.creatorName || 'Usuario'}`,
        duration: 8000,
        action: (
          <Button
            onClick={() => {
              window.location.href = '/dashboard/tickets';
            }}
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg"
          >
            Ver
          </Button>
        ),
      });

      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-detail'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    [toast, qc],
  );

  const handleNewMessage = useCallback(
    (data: any) => {
      if (!data?.ticketId) return;

      const preview = data.message?.text
        ? `${data.message.userName}: "${data.message.text.substring(0, 80)}${data.message.text.length > 80 ? '…' : ''}"`
        : 'Un ticket tiene un nuevo mensaje';

      toast({
        title: '💬 Nuevo mensaje',
        description: preview,
        duration: 6000,
        action: (
          <Button
            onClick={() => {
              window.location.href = '/dashboard/tickets';
            }}
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg"
          >
            Abrir
          </Button>
        ),
      });

      qc.invalidateQueries({ queryKey: ['ticket-detail', data.ticketId] });
    },
    [toast, qc],
  );

  useTicketSocket(handleTicketCreated, handleNewMessage);

  useEffect(() => {
    return () => {
      notifiedRef.current.clear();
    };
  }, []);
}
