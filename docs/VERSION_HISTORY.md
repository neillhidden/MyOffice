# Versões do site

Site principal: https://neillhidden.github.io/MyOffice/
Catálogo: https://neillhidden.github.io/MyOffice/versoes/

Cada push para `main` inicia o workflow `Publicar MyOffice`. Após testes, build e deploy bem-sucedidos, o principal é atualizado e o catálogo inclui uma pré-visualização por commit. `Abrir versão` abre o sistema antigo; `Ver alterações` abre o diff no GitHub. Commits anteriores à aplicação ou que não compilam aparecem sem pré-visualização. A versão atual precisa compilar para a publicação continuar.

As versões são guardadas na branch `pages-archive`, que contém somente arquivos compilados e `versions.json`. Não eliminar essa branch: ela preserva os snapshots mesmo quando o GitHub Pages substitui a publicação. O workflow restaura e reutiliza o arquivo, compila commits novos e publica o conjunto. Não executa deploys por mudanças nessa branch. Os snapshots crescem com o histórico; acompanhar tamanho e limites do GitHub Pages antes de se aproximar do limite de publicação.

Cada versão usa um prefixo próprio de localStorage. Os dados de teste ficam no navegador, separados dos dados do principal e das outras versões; limpar uma versão só limpa o seu prefixo. Isso não constitui backup dos dados, autenticação ou isolamento de segurança: todas as páginas continuam no mesmo domínio. Nenhum dado de utilizador é enviado para a branch. Versões antigas preservam as regras e limitações que tinham naquele momento.

Para testar localmente: executar o build com `MYOFFICE_BASE_PATH=/MyOffice/`, depois `node scripts/build-pages-history.mjs` com Bun disponível. Usar diretórios distintos em `PAGES_OUTPUT_DIR` e `PAGES_ARCHIVE_DIR`, servir a saída sob `/MyOffice/` e executar `node tests/pages-browser-regression.mjs` com `PAGES_TEST_URL`, `PAGES_MANIFEST`, `PLAYWRIGHT_MODULE` e, se necessário, `CHROMIUM_PATH`. Não instalar Playwright na aplicação para este teste.
