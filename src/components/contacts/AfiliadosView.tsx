import React from 'react';
import { Share2, Sparkles, Award, Link, Percent, Users } from 'lucide-react';

export const AfiliadosView: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Contactos • Afiliados
          </h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Em Breve
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Rede de parceiros, promotores e comissionamento por vendas diretas e links de indicação
        </p>
      </div>

      {/* Main Feature Announcement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-5 border border-purple-100 dark:border-purple-800/60">
          <Share2 className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Módulo Reservado para Futuras Versões</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
          Programa de Afiliados & Promotores
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto mb-8">
          Este espaço foi estruturado e reservado na navegação para permitir que a sua empresa expanda as vendas através de comissões, rastreio de conversões e parcerias com influenciadores e promotores independentes.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-2.5">
              <Link className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Links Únicos</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Geração de códigos e links individuais de cupom para cada afiliado.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2.5">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Comissões</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Cálculo automático de comissões por venda integrada diretamente ao Caixa.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-2.5">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Desempenho</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ranking dos promotores mais ativos e controle de repasses financeiros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
