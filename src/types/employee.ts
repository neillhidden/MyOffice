export interface Employee {
  id: string;
  name: string;
  companyId: string; // Relação obrigatória com Empresa
  role?: string; // Cargo/função (opcional)
  department?: string;
  email?: string;
  phone: string; // Contacto (telefone / WhatsApp)
  birthDate?: string; // Data de nascimento (YYYY-MM-DD)
  address?: string; // Endereço (opcional)
  status: 'ativo' | 'inativo';
  accessPermissions?: string[]; // Campo reservado para o futuro
  createdAt: string;
}
