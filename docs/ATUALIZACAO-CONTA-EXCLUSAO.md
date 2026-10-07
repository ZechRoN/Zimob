# Atualização: segurança da conta e exclusão de imobiliárias — 07/10/2026

## Incluído

- Master: Configurações → Senha e segurança → Solicitar alteração de senha.
- Imobiliária: Configurações → Minha conta. Perfis sem administração veem somente sua conta, sem acesso às configurações da empresa.
- Imobiliárias suspensas ou canceladas: menu de ações → Excluir imobiliária. A confirmação aguarda 10 segundos; a mesma regra é validada pelo banco, com permissão exclusiva do Master.
- Contas ativas ou em avaliação não apresentam a opção de exclusão. A situação é verificada novamente no momento da confirmação.
- Exclusão apaga os registros vinculados, incluindo financeiro. Não exclui usuários de autenticação nem imagens no Storage. O modal informa esse alcance. Nenhuma imobiliária real foi excluída durante os testes.

## Publicação

1. A migração supabase/migrations/202610070003_company_deletion.sql já foi aplicada com sucesso ao projeto Supabase kfobwttzodrmfuutuxhk em 07/10/2026. Não executar novamente nesse projeto. O script instalou a função; nenhuma imobiliária foi excluída.
2. Publicar o conteúdo de dist (ou extrair o ZIP entregue) na raiz do subdomínio. Incluir o arquivo .htaccess. O upload no cPanel será feito pelo proprietário.
3. Validar Configurações → Minha conta. O envio depende do email de autenticação do Supabase e do redirecionamento https://zimob.zivello.com.br/reset-senha já configurado. O teste automatizado não envia email real.

Sem a nova migração, o formulário de senha funciona, mas a exclusão não será concluída.

## Emissão financeira e fiscal — pendente

Este pacote NÃO inclui emissão de boleto, cobrança Pix ou NFS-e. O sistema continua sem integração de emissão. A análise anterior está em docs/relatorios/2026-10-07-locacoes-sicredi-nfse.md.

Para implementar a emissão real falta definir/habilitar:

- Sicredi: adesão da conta à API de Cobrança, acesso de integração e habilitação de boleto híbrido. Pix avulso deve ser definido separadamente caso também seja necessário.
- NFS-e: serviço de integração a usar (ou conexão direta aos emissores), cadastro do contribuinte, município, regime, certificado e dados do serviço. Um único cadastro não habilita todas as imobiliárias.
- Ambiente seguro no servidor para as credenciais, homologação e acompanhamento de confirmações. Nenhuma chave bancária, certificado ou senha deve entrar no frontend/dist.

Não houve cadastro em serviço pago, emissão fiscal, registro de boleto ou movimentação financeira.

Referências oficiais:
- Sicredi: https://developers.sicredi.com.br/public/docs/como-obter-acesso-%C3%A0-api-de-cobran%C3%A7a
- NFS-e: https://www.gov.br/pt-br/servicos/emitir-nota-fiscal-de-servico-eletronica
