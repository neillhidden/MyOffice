# MyOffice Desktop — 10/10/2026

Aplicação web de origem: `neillhidden/MyOffice`, commit `9eb8f911d191175fe945173a510eb298000526e6`. Esta entrega mantém o frontend compilado com base `/` e adiciona uma aplicação Electron independente. Os ficheiros rastreados do checkout web não foram alterados durante esta preparação.

`main.cjs` cria a janela, o bloqueio de uma instância, os menus nativos e o processo de utilidade que executa `backend.cjs`. O renderer usa sandbox, isolamento de contexto e não tem acesso direto ao Node. O servidor liga apenas a loopback, verifica Host/Origin e usa a ponte `local-storage.js` para os estados existentes. A base tem `app_storage` e `app_metadata`, com WAL e controlo de revisão. Não foi realizada uma migração integral para as tabelas PostgreSQL de `database`.

Dados Windows: `%APPDATA%\MyOffice\dados\myoffice.sqlite`. Programa Windows: `%LOCALAPPDATA%\Programs\MyOffice`. As atualizações manuais substituem o programa, não a pasta de dados. O backup usa `node:sqlite.backup`; a importação cria uma cópia consistente da origem e conserva a base atual antes de substituir. As fontes e o frontend empacotado são publicados na distribuição, sem dados pessoais.

## Validação concluída

- Electron 44.7.0 oficial Windows/Linux validado com SHA-256 do release e do pacote npm.
- Node 24.21.0/SQLite disponíveis dentro do Electron.
- Janela real Electron com Home/Business, renderer sem `window.require`, menus nativos, persistência e recarregamento.
- Reconhecimento de PDF real no worker do renderer; revisão, confirmação e gravação da despesa no SQLite.
- Backup pelo menu nativo, importação da versão anterior e conservação da base atual.
- Rejeição de SQLite inválido sem substituir dados e recuperação da janela.
- Fecho/reinício do Electron recupera os movimentos importados.
- Instalação reproduzível de dependências com `npm ci`; comando `npm start` validado com Xorg dummy no Linux.

## Limites e próximo ponto

O Electron oficial Windows deste release é **não assinado** (diretório Authenticode ausente). Conservar o runtime original e o seu hash não equivale a assinatura digital da aplicação. O Controlo Inteligente de Aplicações pode bloqueá-lo. Não desativar a proteção nem instalar certificados autoassinados para contornar esse bloqueio. Uma assinatura de código reconhecida continua a ser uma dependência externa, não fornecida por este pacote.

O instalador guiado Windows descarrega e verifica o runtime oficial, extrai com PowerShell, copia a aplicação e cria atalhos. A execução Windows, os atalhos e o comportamento do Controlo Inteligente não puderam ser testados neste ambiente Linux. O pacote não equivale a um instalador `.exe` assinado nem fornece atualização automática, autenticação multiutilizador ou certificação fiscal.

Para desenvolvimento, o helper retido é `/workspace/entrega-local/MyOffice-Electron`; `scripts/setup-cloud-electron.sh` repõe o runtime Linux verificado. `scripts/xorg-dummy.conf` permite testes gráficos; os testes deste ambiente usam um caminho de dados temporário e `--no-sandbox` só no lançamento Linux de teste, não no pacote Windows. O esquema atual mantém a cache do navegador e os seus limites.

Para nova versão, recompilar o frontend de origem com base `/`, copiar `dist` para `site`, atualizar versão/manifesto e gerar novo pacote. Não presumir que commits web atualizam a aplicação desktop. Guardar originais de documentos separadamente quando necessário. O instalador de distribuição contém o código-fonte de instalação; nunca incluir bancos reais ou documentos privados nos artefactos.
