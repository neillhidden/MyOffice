export type NotificationType =
  | 'estoque_baixo'
  | 'produto_reposto'
  | 'evento_proximo'
  | 'aniversario'
  | 'entrega_proxima'
  | 'outro';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference?: {
    type: 'produto' | 'evento' | 'transporte' | 'empregado' | 'agenda' | 'outro';
    id?: string;
  };
  date: string; // ISO format
  read: boolean;
}
