# Implantação do Zimob — 6 de outubro de 2026

Projeto: `kfobwttzodrmfuutuxhk`. Repositório: `ZechRoN/Zimob`.

As duas migrações de `supabase/migrations` foram aplicadas juntas, em uma transação, pelo SQL Editor. Antes da instalação, o schema público estava vazio. Não reaplique a migração base neste projeto.

Verificação remota: 13 tabelas públicas, todas com RLS habilitado; 3 funções `zimob_*`; buckets `logos` e `property-photos`. A chamada pública de catálogo chegou à função e retornou “Imobiliária não encontrada” para uma vitrine inexistente. A consulta anônima a `lead` foi rejeitada por falta de permissão, como esperado.

O Supabase mantém `http://localhost:3000` como Site URL. Foram cadastrados os retornos `/entrar` e `/reset-senha` em `localhost:3000` e `127.0.0.1:3000`. A configuração local usa somente a chave publicável, em `.env.local`, ignorado pelo Git.

Validação local: 22 testes aprovados, TypeScript e ESLint aprovados, build de produção gerado. O build informa um pacote acima de 500 kB; isso não impediu a compilação. A revisão independente encontrou e corrigiu três problemas: interesse “compra” versus “venda”, conversão do horário de visitas para UTC e bloqueio de período de teste vencido.

## Etapas que dependem da operação

- Cadastrar e confirmar a conta Master (`contato@zivello.com.br`, conforme configuração original). Na verificação remota, havia zero usuários. A senha deve ser definida pelo próprio titular. O acesso autenticado no ambiente remoto ainda não foi validado.
- Escolher a hospedagem do frontend, configurar as duas variáveis públicas e publicar `dist`. Atualizar Site URL e os redirecionamentos para o domínio definitivo.
- Configurar e validar SMTP para emails de cadastro e recuperação em produção.
- Cadastrar a imobiliária e seus dados. Não foram importados dados da Blink; esta instalação começou com banco vazio.

O runtime, SDK, login, APIs e scripts de interface da Blink foram removidos do aplicativo. A instalação não precisa da Blink para executar. Revogar uma eventual integração instalada da Blink na conta GitHub é uma configuração separada da conta e não foi executado nesta etapa.
