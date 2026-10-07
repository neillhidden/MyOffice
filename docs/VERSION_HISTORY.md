# Versões do site

Central de projetos: https://neillhidden.github.io/MeusProjetos/

Site principal: https://neillhidden.github.io/MyOffice/
Catálogo: https://neillhidden.github.io/MyOffice/versoes/

Cada push para `main` inicia o workflow `Publicar MyOffice`. Após testes, build e deploy bem-sucedidos, o principal é atualizado e o catálogo inclui uma pré-visualização por commit. `Abrir versão` abre o sistema antigo; `Ver alterações` abre o diff no GitHub. Commits anteriores à aplicação ou que não compilam aparecem sem pré-visualização. A versão atual precisa compilar para a publicação continuar.

As versões são guardadas na branch `pages-archive`, que contém somente arquivos compilados e `versions.json`. Não eliminar essa branch: ela preserva os snapshots mesmo quando o GitHub Pages substitui a publicação. O workflow restaura e reutiliza o arquivo, compila commits novos e publica o conjunto. Não executa deploys por mudanças nessa branch. Os snapshots crescem com o histórico; acompanhar tamanho e limites do GitHub Pages antes de se aproximar do limite de publicação.

Cada versão usa um prefixo próprio de localStorage. Os dados de teste ficam no navegador, separados dos dados do principal e das outras versões; limpar uma versão só limpa o seu prefixo. Isso não constitui backup dos dados, autenticação ou isolamento de segurança: todas as páginas continuam no mesmo domínio. Nenhum dado de utilizador é enviado para a branch. Versões antigas preservam as regras e limitações que tinham naquele momento.

Para testar localmente: executar o build com `MYOFFICE_BASE_PATH=/MyOffice/`, depois `node scripts/build-pages-history.mjs` com Bun disponível. Usar diretórios distintos em `PAGES_OUTPUT_DIR` e `PAGES_ARCHIVE_DIR`, servir a saída sob `/MyOffice/` e executar `node tests/pages-browser-regression.mjs` com `PAGES_TEST_URL`, `PAGES_MANIFEST`, `PLAYWRIGHT_MODULE` e, se necessário, `CHROMIUM_PATH`. Não instalar Playwright na aplicação para este teste.

## Central de projetos

A central está no repositório independente `neillhidden/MeusProjetos`: páginas estáticas em `site/`, publicadas por GitHub Actions. MyOffice guarda somente o seu catálogo/snapshots e links para a central. `scripts/pages-projects.mjs` gera redirecionamentos de compatibilidade para `/projetos/` e `/projetos/bancada/`; o catálogo oferece `Todos os projetos`. Endereços publicados de versões antigas continuam válidos.

Em 2026-10-07, `neillhidden/BANCADA.az` foi confirmado vazio no GitHub e o utilizador confirmou que ainda está a desenvolver o código. Nenhum workflow ou versão fictícia foi criado nesse repositório. Quando o código estiver publicado, configurar seu catálogo e atualizar o cartão em `MeusProjetos/site/index.html`. O MyOffice é atualizado pelo próprio workflow e não depende de novos commits na central.

Regressão específica da central: `node tests/projects-browser-regression.mjs` usando as mesmas variáveis Playwright e URL descritas acima. Verifica escolha dos projetos, abertura do MyOffice antigo, ausência de versões fictícias da Bancada e regresso à central em desktop/mobile.

Para testar a integração sem acesso HTTP ao domínio público, definir `PAGES_HUB_SITE_DIR` com a pasta `site` da central e `PAGES_SITE_DIR` com os artifacts MyOffice. O teste fornece estes arquivos locais para as URLs públicas via Playwright.
