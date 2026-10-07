# Implantação do Zimob — 6 de outubro de 2026

Projeto: `kfobwttzodrmfuutuxhk`. Repositório: `ZechRoN/Zimob`.

As duas migrações de `supabase/migrations` foram aplicadas juntas, em uma transação, pelo SQL Editor. Antes da instalação, o schema público estava vazio. Não reaplique a migração base neste projeto.

Verificação remota: 13 tabelas públicas, todas com RLS habilitado; 3 funções `zimob_*`; buckets `logos` e `property-photos`. A chamada pública de catálogo chegou à função e retornou “Imobiliária não encontrada” para uma vitrine inexistente. A consulta anônima a `lead` foi rejeitada por falta de permissão, como esperado.

O Supabase usa `https://zimob.zivello.com.br` como Site URL. Foram cadastrados os retornos `/entrar` e `/reset-senha` nesse domínio e em `localhost:3000` e `127.0.0.1:3000`. A configuração local usa somente a chave publicável, em `.env.local`, ignorado pelo Git.

Validação local: 22 testes aprovados, TypeScript e ESLint aprovados, build de produção gerado. O build informa um pacote acima de 500 kB; isso não impediu a compilação. A revisão independente encontrou e corrigiu três problemas: interesse “compra” versus “venda”, conversão do horário de visitas para UTC e bloqueio de período de teste vencido.

O titular criou e confirmou a conta `contato@zivello.com.br`; o painel Master abriu autenticado no ambiente local. O site foi publicado pelo cPanel em `/home1/zivell93/zimob.zivello.com.br`, inicialmente vazio, preservando `.well-known`. Login e recuperação respondem com HTTP 200 no domínio HTTPS e o acesso HTTP redireciona para HTTPS. O pacote publicado contém apenas os arquivos compilados, sem fontes ou credenciais privadas.

Os testes do GitHub passaram após restaurar no lock as dependências opcionais das outras plataformas. Todas as versões já testadas foram preservadas. A migração foi integrada à main pelo PR #1 (2a56f61). O titular também acessou o painel Master no domínio público e cadastrou a imobiliária Casa Própria.

## Etapas que dependem da operação

- Configurar e validar SMTP para emails de cadastro e recuperação em produção.
- Completar os dados operacionais da imobiliária. Não foram importados dados da Blink; esta instalação começou com banco vazio.

O runtime, SDK, login, APIs e scripts de interface da Blink foram removidos do aplicativo. A instalação não precisa da Blink para executar. Em 7 de outubro de 2026, o titular informou ter desconectado Supabase e GitHub na Blink. A remoção da instalação Blink.new nas permissões do GitHub ainda não foi conferida independentemente. A versão pública foi novamente verificada: HTTP 200, projeto Supabase correto e nenhuma referência a endpoints Blink no bundle principal.

## Identidade visual e administração

Os arquivos originais enviados pelo titular foram copiados para public/brand e public/favicon.png. A identidade Zimob substitui o nome e os ícones antigos nas telas, navegação, vitrine e metadados. Login, cadastro e recuperação compartilham o novo layout. O Master usa cores legíveis, lista com status em português e configurações que explicam as preferências, acessos e integrações disponíveis. O tema foi ligado à raiz da aplicação e preserva a preferência anterior do navegador.

Validação da atualização: login real no ambiente local, lista com a imobiliária existente, temas claro/escuro e menu recolhido conferidos no navegador. O controle de viewport não alterou a largura efetiva; não há validação visual móvel concluída. Revisão independente apontou contraste dos botões escuros e texto sobre atribuição de planos; ambos corrigidos.
