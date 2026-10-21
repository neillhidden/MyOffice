import React from 'react';
import { Share2, Link, Percent, Award } from 'lucide-react';
import { ComingSoonView } from '../common/ComingSoonView';

interface AfiliadosViewProps {
  onBack?: () => void;
}

export const AfiliadosView: React.FC<AfiliadosViewProps> = ({ onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <ComingSoonView
      id="afiliados-view"
      moduleName="Contactos • Afiliados"
      badge="Em breve"
      title="Programa de Afiliados & Promotores"
      description="Rede de parceiros, promotores e comissionamento por vendas diretas e links de indicação para expansão do alcance comercial da sua empresa."
      icon={Share2}
      onBack={handleBack}
      backLabel="Voltar para Contactos"
      highlights={[
        {
          title: 'Links Únicos',
          description: 'Geração de códigos e links individuais de cupom para cada parceiro comercial.',
          icon: Link,
        },
        {
          title: 'Comissões Automáticas',
          description: 'Cálculo de comissões por venda concluída integrado diretamente ao Caixa e Financeiro.',
          icon: Percent,
        },
        {
          title: 'Acompanhamento',
          description: 'Desempenho dos promotores mais ativos e controlo de liquidações a pagar.',
          icon: Award,
        },
      ]}
    />
  );
};
