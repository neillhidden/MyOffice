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
| `npm test` | `node --import tsx --test tests/*.test.ts` | Regressões de IDs, validação de vendas e migração/estornos |
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


## 6. Regressões de integridade e esquema offline

Da raiz do checkout executar `npm test`, `npm run lint` e `npm run build`. Nenhuma dependência de produção foi adicionada. A fixture em `tests/fixtures/provider.html` expõe o contexto **apenas na página de teste do Vite** e não entra no build de produção.

Para as regressões funcionais opcionais, instalar as ferramentas fora do checkout:

```sh
npm --cache /workspace/.cache/npm install --prefix /workspace/.tools/browser playwright-core@1.58.2 --no-audit --no-fund
npm --cache /workspace/.cache/npm install --prefix /workspace/.tools/database @electric-sql/pglite@0.3.14 --no-audit --no-fund
```

Com Chromium disponível e `npm run dev -- --strictPort` ativo numa sessão separada:

```sh
cd /workspace/MyOffice
MYOFFICE_PLAYWRIGHT_MODULE=/workspace/.tools/browser/node_modules/playwright-core/index.mjs node --test tests/browser-regression.mjs
MYOFFICE_PGLITE_MODULE=/workspace/.tools/database/node_modules/@electric-sql/pglite/dist/index.js node --test tests/database-regression.mjs
```

Pode configurar `MYOFFICE_CHROMIUM` e `MYOFFICE_TEST_URL` para outros ambientes. Se os módulos estiverem disponíveis no mecanismo normal de resolução Node, as variáveis de caminho são opcionais. Os testes de navegador usam contextos novos, sem afetar o perfil/dados do utilizador. Os testes SQL usam PostgreSQL embutido em memória; não criam uma conexão externa nem executam a migração na aplicação.


## GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` testa e publica os commits enviados para `main`. O build de Pages usa `MYOFFICE_BASE_PATH=/MyOffice/`; desenvolvimento e outros builds continuam a usar `/`. Ativar Settings → Pages → Source → GitHub Actions. O site publica apenas o front-end e continua com dados locais do navegador.

## Mensagens de commit

Preferência explícita do utilizador: escrever as mensagens dos novos commits em português, com uma descrição clara da alteração. Preservar os commits já publicados; não reescrever o histórico apenas para traduzir mensagens antigas.

Regressão da etapa categorias/calendário/tema: `PLAYWRIGHT_MODULE=/caminho/playwright/index.mjs CHROMIUM_PATH=/caminho/chromium HOME_TEST_URL=http://127.0.0.1:4191/ node tests/calendar-shopping-browser.mjs`. Usa perfil isolado e relógio controlado; não altera dados de utilizadores.

## Testar as ferramentas Home

`npm test` inclui home-extensions.test.ts (dívidas/prestações, recuperação, tarefas, previsões, CSV/conferência, documentos e PDF).

Com o servidor local ou preview de produção ativo, executar:

```bash
PLAYWRIGHT_MODULE=/caminho/playwright-core/index.mjs CHROMIUM_PATH=/usr/bin/chromium HOME_TEST_URL=http://127.0.0.1:4191/ node tests/home-tools-browser.mjs
MYOFFICE_PGLITE_MODULE=/caminho/pglite/dist/index.js node --test tests/home-tools-database-regression.mjs
```

O teste funcional precisa de `pdftotext` (Poppler) para verificar o PDF descarregado; não é dependência do produto. Produção GitHub Pages: construir e iniciar preview com MYOFFICE_BASE_PATH=/MyOffice/ (ex.: `MYOFFICE_BASE_PATH=/MyOffice/ npm run preview -- --port 4199`) e testar a URL local correspondente `/MyOffice/`. Nenhum teste SQL liga a uma base externa.
