# Guia de Desenvolvimento e Execução — MyOffice

Este documento descreve o ambiente técnico, dependências, scripts disponíveis e procedimentos de verificação para qualquer agente de IA ou programador.

---

## 1. Requisitos de Ambiente

- **Runtime**: Node.js (v20+ recomendado) ou Bun (`bun.lock` presente no repositório).
- **Porta do Servidor de Desenvolvimento**: **`3000`** (`--port=3000 --host=0.0.0.0`).
- **Restrições de Execução (Compatibilidade com Preview/iFrame)**:
  - **Não utilizar** `window.alert()`, `window.confirm()` ou `window.prompt()` — utilizar sempre modais React customizados.

---

## 2. Scripts Disponíveis (`package.json`)

| Comando | Script Executado | Descrição |
| :--- | :--- | :--- |
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Inicia o servidor de desenvolvimento Vite na porta 3000 |
| `npm run lint` | `tsc --noEmit` | Executa a verificação completa de tipos TypeScript sem emitir ficheiros |
| `npm run build` | `vite build` | Gera o bundle de produção otimizado na pasta `dist/` |
| `npm run preview` | `vite preview` | Serve localmente o bundle de produção compilado |
| `npm run clean` | `rm -rf dist server.js` | Limpa artefactos de compilação |

---

## 3. Dependências Principais Instaladas

### 3.1. Dependências de Produção (`dependencies`)
- `react` (`^19.0.1`) & `react-dom` (`^19.0.1`) — Biblioteca UI principal.
- `lucide-react` (`^0.546.0`) — Biblioteca de ícones vetoriais.
- `recharts` (`^3.10.1`) — Gráficos do módulo Dashboard.
- `motion` (`^12.23.24`) — Utilitários de animação (disponível no projeto).
- `vite` (`^6.2.3`), `@vitejs/plugin-react` (`^5.0.4`), `@tailwindcss/vite` (`^4.1.14`) — Bundler e integração Tailwind CSS v4.
- `@google/genai` (`^2.4.0`), `express` (`^4.21.2`), `dotenv` (`^17.2.3`) — Instalados no template base, mas **ainda não utilizados no código atual** (reservas para futuro backend/módulo de Agentes).

### 3.2. Dependências de Desenvolvimento (`devDependencies`)
- `typescript` (`~5.8.2`), `tailwindcss` (`^4.1.14`), `tsx` (`^4.21.0`), `esbuild` (`^0.25.0`), `autoprefixer` (`^10.4.21`), `@types/node`, `@types/express`.

---

## 4. Variáveis de Ambiente (`.env.example`)

O ficheiro `.env.example` define:
- `GEMINI_API_KEY`: Chave da API Gemini (para uso futuro caso o módulo `Agentes` ou funcionalidades de IA server-side sejam ativadas).
- `APP_URL`: URL base da aplicação hospedada.

> **Nota**: Atualmente, a aplicação não lê variáveis `import.meta.env.VITE_*` no frontend, pois todas as operações correm localmente no navegador.

---

## 5. Checklist de Validação Antes de Concluir Qualquer Tarefa

Antes de dar uma tarefa por concluída, qualquer agente deve verificar:

1. **Verificação de Tipos e Compilação**:
   - Executar `npm run lint` (`tsc --noEmit`) — zero erros de TypeScript.
   - Executar `npm run build` (`vite build`) — build de produção concluído com sucesso.
2. **Invariantes de Negócio**:
   - Empresas com `status === 'desativada'` (*Kianda*) continuam ocultas nas vistas operacionais?
   - Empresas com `status === 'parada'` continuam com ações bloqueadas?
   - O cálculo de estoque ignora movimentos com `removido: true`?
   - Nenhum registo de movimentação ou lançamento financeiro foi fisicamente apagado?
3. **Integridade de UI (Claro e Escuro)**:
   - Novos componentes respeitam as classes de superfície e borda do tema escuro (`dark:bg-dm-surface`, `dark:border-dm-border`, `dark:text-dm-text`) definidas em `src/index.css`?
4. **Atualização da Documentação**:
   - Registar a alteração em [`docs/CHANGELOG_AI.md`](./CHANGELOG_AI.md) e atualizar os documentos relevantes em `docs/`.
