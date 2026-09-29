# ImobFlow — sua cópia na Blink

1. Abra o link do template e clique em **Remixar projeto**. Entre ou crie sua conta Blink.
2. Aguarde a cópia. Cole o comando abaixo na conversa da sua cópia, trocando apenas o email.
3. Depois da ativação, abra **Entrar ou criar minha conta** no aplicativo e use o mesmo email. A conta do aplicativo é separada da conta do editor. Verifique o email se a tela solicitar.
4. No painel Master, crie sua primeira imobiliária. Use **Abrir imobiliária** para cadastrar imóveis, equipe, leads e suas visitas. Em Configurações, personalize a marca e copie o endereço da vitrine.

## Comando para colar

> Ative esta cópia do ImobFlow seguindo BLINK_ALUNOS.md. Meu email de administrador é SEU_EMAIL_AQUI. Preserve as telas e funções existentes. Configure login, banco e backend desta cópia. Se o plano bloquear o backend, explique e aguarde minha decisão. Entregue o link de acesso e os próximos cliques.

## O que esperar

Você pode abrir o template e iniciar o Remix antes de decidir pelo plano. O funcionamento de login, banco e backend depende de um plano Blink que habilite backend; nesta instalação foi usado Pro. A Blink pode cobrar créditos para executar o comando. Não prometa gratuidade ou assinatura obrigatória para simplesmente abrir e copiar.

A base inclui imóveis, fotos e vitrine pública, CRM com funil, propostas, visitas, equipe, receitas, custos, comissões e sugestões por regras. Começa sem clientes reais. A demonstração usa somente dados fictícios. As sugestões do AI Growth usam os registros da imobiliária, sem modelo de IA ou custo de API.

WhatsApp é aberto manualmente por link. Emails de convite, notificações e cobranças automáticas não estão integrados. Os planos, valores comerciais e limites exibidos são exemplos para personalizar. Nenhum pagamento é processado pelo template. Receitas e comissões são lançadas manualmente; o saldo previsto desconta custos e comissões registrados, inclusive pendentes; aceitar uma proposta não registra o valor do imóvel como receita da imobiliária.

O acesso à prévia Blink pode exigir login no editor. Uma vitrine aberta para visitantes externos precisa de publicação/hospedagem Blink e eventualmente domínio, conforme as condições da plataforma. O template não ativa hospedagem paga automaticamente. Metadados dinâmicos são do aplicativo SPA; prévias sociais indexadas podem exigir renderização no servidor.

## Instruções técnicas para a Blink executar

- Preserve a interface e a lógica; não recrie do zero. Use `npm install` e depois `npm run typecheck`, `npm test`, `npm run build:backend` e `npm run build`.
- Este projeto usa React/Vite/TanStack Router, SDK Blink e Hono em `server/index.ts`. Não requer Supabase, Lovable, Resend ou chaves de terceiros para os módulos centrais.
- Use o ID **desta nova cópia**, a chave pública desta cópia e backend próprio. Configure `VITE_BLINK_PROJECT_ID`, `VITE_BLINK_PUBLISHABLE_KEY` e `VITE_BLINK_BACKEND_URL=https://<últimos 8 caracteres do ID>.backend.blink.new`. Nunca reutilize banco/URL da origem.
- Configure no ambiente do backend `OWNER_PROJECT_ID=<ID desta cópia>` e `OWNER_EMAIL=<email informado pelo aluno>`. Remova `OWNER_USER_ID` herdado se houver. `BLINK_PROJECT_ID` e `BLINK_SECRET_KEY` pertencem ao runtime Blink. Não exponha secret no frontend.
- Não mantenha usuários, proprietários, leads, fotos ou dados da origem. No Remix limpo, o banco recebe o schema e configurações. Caso tenha copiado dados de alguma versão antiga, não os use como base de clientes; peça revisão antes de apagar registros reais.
- Antes do primeiro health, inicialize o banco desta cópia pelo painel Database ou pelo CLI oficial com `BLINK_ACTIVE_PROJECT=<ID_DESTA_COPIA> blink db query "SELECT 1 AS health"`. Se o health responder `Database not found`, faça essa inicialização e tente novamente, sem recriar o sistema. Se faltar a chave de runtime, use a chave secreta nativa gerada para este projeto no backend; nunca a chave de outro projeto nem a exponha no frontend.
- Publique somente `backend/index.ts`, gerado por `npm run build:backend`, como backend Hono. O primeiro `/health` inicializa as tabelas via batch e triggers inteiros. Não divida triggers em comandos separados pelo `;`.
- Aplique `scripts/native/security-policy.json` às tabelas Blink. O acesso público ao SDK de banco é negado; a aplicação usa o backend, que valida identidade, papel e imobiliária. O storage exige autenticação; upload de logo/foto usa caminho exclusivo de usuário.
- A identidade Master é vinculada ao email verificado e ID deste projeto. Nunca dê Master ao primeiro visitante. Login no editor não autentica automaticamente no aplicativo.
- Compile, abra a prévia, teste `/health`, login e bootstrap. Salve uma versão do código no editor Blink. Deploy do diretório dist sozinho não deixa o código clonável.
- Uma imobiliária e sua equipe recebem acesso por email verificado no login Blink. Não crie senha fictícia ou diga que enviou convite automaticamente. O administrador compartilha o link e email autorizado.
- Testes automatizados cobrem isolamento, dados públicos, vínculo entre lead/imóvel/imobiliária, reserva atômica, conflito de horário e valores financeiros. O Remix em outra conta e login real completo do administrador ainda precisam de validação nesta cópia.
