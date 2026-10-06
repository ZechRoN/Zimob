# Zimob

Gestão imobiliária com React/Vite e Supabase. O código pertence ao repositório ZechRoN/Zimob. Login, banco, permissões e arquivos funcionam no Supabase; não há dependência da Blink para executar ou publicar.

## Executar

Use Node.js 22 ou superior.

1. `npm ci`
2. Copie `.env.example` para `.env.local` e informe a chave **publicável** do projeto Supabase. Nunca use service_role/secret no frontend.
3. `npm run dev` e abra `http://localhost:3000`.

## Banco

Projeto indicado: `kfobwttzodrmfuutuxhk`.

As migrações em `supabase/migrations` são ordenadas por nome. A primeira prepara o schema; a segunda adiciona funções, validações e políticas de Storage. Aplique uma única vez em banco novo, dentro de transação. Em um banco existente, inspecione schema e histórico antes de aplicar; não execute a base cegamente nem apague dados para compatibilizar.

A conta Master é o email confirmado configurado em `app_config.super_admin_emails`. Nesta instalação, o email herdado da configuração do projeto é `contato@zivello.com.br`. Nenhum primeiro visitante recebe privilégios automaticamente.

O Master cadastra a imobiliária e autoriza o email do titular. Use **Abrir imobiliária** para selecionar o contexto. O titular e os corretores criam sua própria conta e confirmam o email; o vínculo é realizado no primeiro acesso. Convites de equipe são autorizações por email; compartilhe o endereço de entrada manualmente.

## Autenticação e publicação

Em Supabase > Authentication > URL Configuration, defina a URL pública do frontend e permita os redirecionamentos `/entrar` e `/reset-senha`, além dos equivalentes em localhost durante desenvolvimento. Mantenha confirmação de email habilitada e configure SMTP para entrega de emails de autenticação em produção.

`npm run build` gera `dist`. Hospede esse diretório em um serviço de frontend com fallback de rotas para `index.html`. O repositório inclui configurações para Vercel e Netlify. Configure as duas variáveis públicas de `.env.example` no provedor antes de compilar. GitHub guarda o código e Supabase executa o backend; o frontend precisa de hospedagem própria.

## Módulos

Imóveis/fotos/vitrine, leads/funil, propostas, visitas/agendamento público, equipe, financeiro, comissões e relatórios. Imagens de divulgação em `logos` e `property-photos` são públicas; escrita limitada por imobiliária e papel. Não use esses buckets para documentos privados.

WhatsApp abre links manuais; notificações comerciais e cobrança automática não estão integradas. Planos/limites são ilustrativos. AI Growth calcula sugestões por regras; não chama modelos de IA. Aceitar uma proposta não lança receita automaticamente: registre receita e comissão separadamente.

## Validação

- `npm run typecheck`
- `npm run lint`
- `npm test`: testes PostgreSQL das migrações e testes de domínio legados preservados como referência durante a migração.
- `npm run build`

O workflow GitHub Actions executa essas verificações. Os arquivos de domínio SQLite em `server/native` e seus fixtures em `scripts/native` são usados apenas pelos testes de regressão legados, sem backend executável nem conexão com a plataforma anterior.
