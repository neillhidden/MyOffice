# MyOffice com Electron

[Descarregar o pacote de instalação (cerca de 10 MB)](https://github.com/neillhidden/MyOffice/raw/refs/heads/distribuicao-windows/MyOffice-Electron-Instalacao.zip).

1. Instalar [Node.js 24 x64 oficial](https://nodejs.org/dist/v24.19.0/node-v24.19.0-x64.msi), se ainda não estiver instalado.
2. Extrair a pasta completa do ZIP.
3. Na pasta que contém `INSTALAR-MYOFFICE.cjs`, escrever `cmd` na barra de endereço do Explorador e pressionar Enter.
4. Executar `node INSTALAR-MYOFFICE.cjs`.

O instalador descarrega e verifica o Electron oficial, instala o programa e cria os atalhos no Ambiente de Trabalho e no menu Iniciar. O download total inicial é aproximadamente 170 MB. As atualizações são manuais e também descarregam o runtime. O instalador guiado não é um instalador `.exe` assinado.

A base fica em `%APPDATA%\MyOffice\dados\myoffice.sqlite`, separada do programa. No Electron, o menu **Ficheiro** permite backup, restauro e importação da base da versão anterior. Primeiro guardar um backup na versão anterior e fechá-la; depois importar esse backup no Electron. Uma cópia da base atual é preservada antes da substituição.

**O Electron desta distribuição oficial é não assinado e o Windows pode bloqueá-lo.** Não desativar o Controlo Inteligente de Aplicações. Se o bloqueio continuar, uma assinatura de código reconhecida ainda precisa ser providenciada. O pacote oferece uma alternativa no navegador: `node ABRIR-NAVEGADOR.cjs`, usando a mesma base SQLite e Node.js oficial.

Janela real Electron, Home/Business, leitura/aplicação de PDF, persistência, menus de backup/importação, rejeição de cópia inválida e recuperação após reinício foram testados no Linux. A execução Windows, os atalhos e a decisão do Controlo Inteligente não foram testados num Windows neste ambiente. Nenhum dado pessoal ou base de testes faz parte do pacote.

As fontes desktop e o frontend compilado estão na pasta `electron` desta branch. A aplicação web de origem continua na branch `main`, commit `9eb8f911`. Para desenvolvimento, `npm ci` repõe as dependências e o runtime Electron deve ser instalado explicitamente (`npx install-electron` no Windows; `bash scripts/setup-cloud-electron.sh` no ambiente Linux preparado). `npm start` abre a aplicação. O build portátil é `npm run package:windows -- caminho/electron-v44.7.0-win32-x64.zip`; o hash do ZIP oficial é verificado. Recompilar e atualizar `site` quando o frontend de origem mudar; os commits web não atualizam automaticamente o desktop.
