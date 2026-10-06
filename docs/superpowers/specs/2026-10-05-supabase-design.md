# Zimob independente

Migrar o sistema existente para o projeto Supabase `kfobwttzodrmfuutuxhk`, com código no repositório ZechRoN/Zimob. Preservar as telas e os módulos; remover SDK, autenticação, runtime, widgets, scripts e configuração da Blink.

## Arquitetura
React/Vite continua como frontend. Supabase Auth gerencia cadastro, confirmação, login, recuperação e logout. Postgres com RLS mantém os dados por imobiliária; funções RPC transacionais implementam bootstrap, criação de imobiliária e catálogo/reserva públicos. Storage possui buckets públicos para imagens de marketing, com escrita limitada à imobiliária e papel autorizado. Nenhuma chave secreta no navegador.

O Master precisa escolher uma imobiliária para operar seus módulos. As consultas do frontend devem filtrar explicitamente company_id, além de RLS. Contas suspensas não podem operar os módulos. Convites por email são vinculados somente após confirmação da identidade. Financeiro é limitado a owner/admin/financeiro.

## Preservação
Não apagar dados remotos. Inspecionar schema antes de aplicar migrações. WhatsApp, cobranças e sugestões por regras mantêm o escopo manual já existente. Não importar dados da Blink sem solicitação e origem identificada. O usuário indicou Supabase e GitHub, mas não uma hospedagem de frontend; preparar build independente e documentação.

## Validação
Executar migrações contra PostgreSQL de testes, testar RLS com dois tenants e diferentes papéis, vínculos cruzados, suspensão, dados públicos e atomicidade de reserva. Verificar tipos, build e login no navegador quando o acesso real estiver disponível. Distinguir código validado de implantação remota validada.
