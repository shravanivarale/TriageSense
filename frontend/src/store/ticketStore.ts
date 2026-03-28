import { create } from 'zustand';
import { Ticket, Stats, WSMessage } from '../types';

interface TicketStore {
  tickets: Ticket[];
  stats: Stats | null;
  selectedTicket: Ticket | null;
  clusterStorm: { cluster_label: string; count: number; category?: string } | null;
  processingIds: Set<string>;
  activeTab: 'dashboard' | 'analytics' | 'submit';

  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  setTickets: (tickets: Ticket[]) => void;
  setStats: (stats: Stats) => void;
  selectTicket: (ticket: Ticket | null) => void;
  setActiveTab: (tab: 'dashboard' | 'analytics' | 'submit') => void;
  handleWSMessage: (msg: WSMessage) => void;
  dismissStorm: () => void;
}

export const useTicketStore = create<TicketStore>((set, get) => ({
  tickets: [],
  stats: null,
  selectedTicket: null,
  clusterStorm: null,
  processingIds: new Set(),
  activeTab: 'dashboard',

  addTicket: (ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets].slice(0, 200), // Keep last 200
  })),

  updateTicket: (id, updates) => set((state) => ({
    tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t),
    selectedTicket: state.selectedTicket?.id === id
      ? { ...state.selectedTicket, ...updates } as Ticket
      : state.selectedTicket,
  })),

  setTickets: (tickets) => set({ tickets }),
  setStats: (stats) => set({ stats }),
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  dismissStorm: () => set({ clusterStorm: null }),

  handleWSMessage: (msg) => {
    switch (msg.type) {
      case 'ticket_processing':
        set((state) => ({
          processingIds: new Set([...state.processingIds, msg.payload.id])
        }));
        break;

      case 'ticket_processed': {
        const { addTicket, updateTicket } = get();
        const exists = get().tickets.find(t => t.id === msg.payload.id);
        if (exists) {
          updateTicket(msg.payload.id, msg.payload);
        } else {
          addTicket(msg.payload);
        }
        set((state) => {
          const next = new Set(state.processingIds);
          next.delete(msg.payload.id);
          return { processingIds: next };
        });
        break;
      }

      case 'ticket_updated':
        get().updateTicket(msg.payload.id, msg.payload);
        break;

      case 'cluster_storm':
        set({ clusterStorm: msg.payload });
        break;
    }
  },
}));
