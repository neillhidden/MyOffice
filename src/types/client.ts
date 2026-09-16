export type ClientType = 'individual' | 'empresa';
export type ClientStatus = 'ativo' | 'inativo';

export interface Client {
  id: string;
  name: string;
  phone: string; // Número de telefone normal
  whatsapp?: string; // Número de WhatsApp (campo separado)
  address?: string; // Endereço (importante para entregas)
  email?: string;
  document?: string; // NIF / BI
  type?: ClientType;
  status?: ClientStatus;
  notes?: string;
  createdAt: string; // Data de cadastro (ISO)
}
