# Implantação do Zimob — 6 de outubro de 2026

Projeto: `kfobwttzodrmfuutuxhk`. Repositório: `ZechRoN/Zimob`.

As duas migrações de `supabase/migrations` foram aplicadas juntas, em uma transação, pelo SQL Editor. Antes da instalação, o schema público estava vazio. Não reaplique a migração base neste projeto.

Verificação remota: 13 tabelas públicas, todas com RLS habilitado; 3 funções `zimob_*`; buckets `logos` e `property-photos`. A chamada pública de catálogo chegou à função e retornou “Imobiliária não encontrada” para uma vitrine inexistente. A consulta anônima a `lead` foi rejeitada por falta de permissão, como esperado.

O Supabase usa `https://zimob.zivello.com.br` como Site URL. Foram cadastrados os retornos `/entrar` e `/reset-senha` nesse domínio e em `localhost:3000` e `127.0.0.1:3000`. A configuração local usa somente a chave publicável, em `.env.local`, ignorado pelo Git.

Validação local: 22 testes aprovados, TypeScript e ESLint aprovados, build de produção gerado. O build informa um pacote acima de 500 kB; isso não impediu a compilação. A revisão independente encontrou e corrigiu três problemas: interesse “compra” versus “venda”, conversão do horário de visitas para UTC e bloqueio de período de teste vencido.

O titular criou e confirmou a conta `contato@zivello.com.br`; o painel Master abriu autenticado no ambiente local. O site foi publicado pelo cPanel em `/home1/zivell93/zimob.zivello.com.br`, inicialmente vazio, preservando `.well-known`. Login e recuperação respondem com HTTP 200 no domínio HTTPS e o acesso HTTP redireciona para HTTPS. O pacote publicado contém apenas os arquivos compilados, sem fontes ou credenciais privadas.

Os testes do GitHub passaram após restaurar no lock as dependências opcionais das outras plataformas. Todas as versões já testadas foram preservadas. O login autenticado no domínio público ainda depende da entrada do usuário nessa origem; a sessão local não é transferida.

## Etapas que dependem da operação

- Configurar e validar SMTP para emails de cadastro e recuperação em produção.
- Cadastrar a imobiliária e seus dados. Não foram importados dados da Blink; esta instalação começou com banco vazio.

O runtime, SDK, login, APIs e scripts de interface da Blink foram removidos do aplicativo. A instalação não precisa da Blink para executar. A integração Blink.new ainda aparece nos aplicativos do repositório. Sua configuração exige reautenticação do titular no GitHub; a retirada do acesso está pendente dessa etapa.
