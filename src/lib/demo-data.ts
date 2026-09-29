// Rich seed dataset for Imobiliária Excellence demo
export const demoCompany = {
  id: "demo-1",
  name: "Imobiliária Excellence",
  slug: "excellence",
  cnpj: "12.345.678/0001-90",
  phone: "(11) 99999-0000",
  address: "Av. Paulista, 1000 — Bela Vista, São Paulo/SP",
  primary_color: "#2563EB",
  plan: "profissional",
  creci: "CRECI/SP 123456-J",
  years_market: 12,
  closed_deals: 387,
};

// Stats por corretor (KPIs cards) — exibido em /app/equipe e /app/relatorios
export const brokerStats = [
  { id: "b1", name: "Rafael Mendes",   avatar: "https://i.pravatar.cc/96?img=12", role: "corretor",  creci: "98321-F", phone: "(11) 99100-0001", rating: 4.9, active_props: 22, sales_month: 4, commission_month: 38400, conversion_pct: 23, status: "ativo" },
  { id: "b2", name: "Carla Oliveira",  avatar: "https://i.pravatar.cc/96?img=47", role: "corretora", creci: "76543-F", phone: "(11) 99100-0002", rating: 4.8, active_props: 18, sales_month: 3, commission_month: 51200, conversion_pct: 28, status: "ativo" },
  { id: "b3", name: "Thiago Santos",   avatar: "https://i.pravatar.cc/96?img=33", role: "corretor",  creci: "54321-F", phone: "(11) 99100-0003", rating: 4.6, active_props: 15, sales_month: 2, commission_month: 22800, conversion_pct: 19, status: "ativo" },
  { id: "b4", name: "Ana Lima",        avatar: "https://i.pravatar.cc/96?img=5",  role: "sdr",       creci: "—",       phone: "(11) 99100-0004", rating: 4.7, active_props: 0,  sales_month: 0, commission_month: 0,     conversion_pct: 0,  status: "ativo" },
  { id: "b5", name: "Marcos Ferreira", avatar: "https://i.pravatar.cc/96?img=53", role: "financeiro",creci: "—",       phone: "(11) 99100-0005", rating: 4.8, active_props: 0,  sales_month: 0, commission_month: 0,     conversion_pct: 0,  status: "ativo" },
];

// Série mensal 12m de vendas/aluguéis (AreaChart Dashboard)
export const monthlySales12m = (() => {
  const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return labels.map((m, i) => ({
    month: m,
    vendas: 380000 + Math.round(Math.sin(i / 1.7) * 180000 + i * 32000),
    alugueis: 22000 + Math.round(Math.cos(i / 2) * 9000 + i * 1800),
  }));
})();

// Receitas vs Despesas 6 meses (Financeiro)
export const finance6m = (() => {
  const labels = ["Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return labels.map((m, i) => ({
    month: m,
    receitas: 58000 + Math.round(Math.sin(i / 1.5) * 18000 + i * 4500),
    despesas: 32000 + Math.round(Math.cos(i / 2) * 6000 + i * 1200),
  }));
})();

// Bairros mais procurados (PieChart Relatórios)
export const neighborhoodDemand = [
  { name: "Vila Mariana", value: 38 },
  { name: "Pinheiros",    value: 31 },
  { name: "Jardins",      value: 27 },
  { name: "Moema",        value: 22 },
  { name: "Itaim Bibi",   value: 19 },
  { name: "Alphaville",   value: 14 },
];

// Categorias financeiras de mercado imobiliário
export const FIN_REV_CATEGORIES  = ["Comissão Venda", "Comissão Aluguel", "Taxa Administração", "Avaliação", "Intermediação"];
export const FIN_COST_CATEGORIES = ["Marketing", "Anúncios Portais", "Salários", "Aluguel Escritório", "Cartório", "Avaliação", "Energia/Internet", "Plataforma SaaS"];

// Mensagens prontas de WhatsApp para AI Growth
export const aiCampaigns = [
  { id: "c1", lead: "Carlos Mendes",  property: "Apartamento Jardins",     msg: "Oi Carlos! Achei um apartamento no Jardins que parece feito pra você: 3 quartos, 145m², R$ 1.85M. Posso te mostrar essa semana?" },
  { id: "c2", lead: "Marina Costa",   property: "Casa Alphaville",         msg: "Oi Marina! Lembra da casa em Alphaville? Acabou de baixar para R$ 2.4M. Topa marcar uma visita?" },
  { id: "c3", lead: "Pedro Almeida",  property: "Cobertura Duplex Itaim",  msg: "Oi Pedro! Cobertura duplex Itaim com piscina ainda disponível. Posso reservar visita pro fim de semana?" },
  { id: "c4", lead: "Ana Ribeiro",    property: "Lançamento Vista Verde",  msg: "Oi Ana! Sobre o lançamento Vista Verde: liberaram unidade de 65m² 2 dorms por R$ 590k. Te interessa?" },
  { id: "c5", lead: "Roberto Vieira", property: "Casa em Alphaville",      msg: "Oi Roberto! Sobre sua proposta de R$ 2.35M — proprietário topa 2.38M com escritura paga. Fecha?" },
];

export const demoBrokers = [
  { id: "b1", name: "Rafael Mendes",   role: "corretor",   leads: 12, closings: 3, avatar: "https://i.pravatar.cc/64?img=12" },
  { id: "b2", name: "Carla Oliveira",  role: "corretora",  leads: 9,  closings: 2, avatar: "https://i.pravatar.cc/64?img=47" },
  { id: "b3", name: "Thiago Santos",   role: "corretor",   leads: 7,  closings: 1, avatar: "https://i.pravatar.cc/64?img=33" },
  { id: "b4", name: "Ana Lima",        role: "sdr",        leads: 15, closings: 0, avatar: "https://i.pravatar.cc/64?img=5"  },
  { id: "b5", name: "Marcos Ferreira", role: "financeiro", leads: 0,  closings: 0, avatar: "https://i.pravatar.cc/64?img=53" },
];

export const PIPELINE_STAGES = [
  { id: "lead_novo",         label: "Novo lead",        color: "#6B7280", bg: "#F3F4F6" },
  { id: "contato_iniciado",  label: "Contato iniciado", color: "#1E40AF", bg: "#DBEAFE" },
  { id: "qualificado",       label: "Qualificado",      color: "#C2410C", bg: "#FFEDD5" },
  { id: "visita_marcada",    label: "Visita marcada",   color: "#A16207", bg: "#FEF3C7" },
  { id: "visita_realizada",  label: "Visita realizada", color: "#854D0E", bg: "#FEF9C3" },
  { id: "proposta_enviada",  label: "Proposta enviada", color: "#15803D", bg: "#DCFCE7" },
  { id: "negociacao",        label: "Negociação",       color: "#1D4ED8", bg: "#DBEAFE" },
  { id: "fechado",           label: "Fechado",          color: "#166534", bg: "#BBF7D0" },
  { id: "perdido",           label: "Perdido",          color: "#991B1B", bg: "#FEE2E2" },
] as const;

export const TAG_COLORS: Record<string, { color: string; bg: string }> = {
  quente: { color: "#991B1B", bg: "#FEE2E2" },
  morno:  { color: "#C2410C", bg: "#FFEDD5" },
  frio:   { color: "#1E40AF", bg: "#DBEAFE" },
  novo:   { color: "#166534", bg: "#DCFCE7" },
};

const u = (id: string) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;

export const demoProperties = [
  { id: "p1",  title: "Apartamento Alto Padrão Jardins",   type: "apartamento", finalidade: "venda",   price: 1850000, bedrooms: 3, bathrooms: 4, area: 145, neighborhood: "Jardins",       city: "São Paulo", featured: true,  publish: true, image_url: u("photo-1545324418-cc1a3fa10c00"), tags: ["Alto padrão", "Reformado"], status: "disponivel", description: "Cobertura impecável com 3 suítes, varanda gourmet e vista panorâmica.", broker_id: "b1", last_activity: 2 },
  { id: "p2",  title: "Casa em Alphaville",                 type: "casa",        finalidade: "venda",   price: 2400000, bedrooms: 4, bathrooms: 5, area: 380, neighborhood: "Alphaville",     city: "Barueri",   featured: true,  publish: true, image_url: u("photo-1564013799919-ab600027ffc6"),  tags: ["Piscina", "Condomínio"],   status: "disponivel", description: "Casa térrea em condomínio fechado, 4 suítes, piscina e jardim.", broker_id: "b2", last_activity: 5 },
  { id: "p3",  title: "Studio Vila Madalena",               type: "apartamento", finalidade: "aluguel", price: 4200,    bedrooms: 1, bathrooms: 1, area: 42,  neighborhood: "Vila Madalena",  city: "São Paulo", featured: false, publish: true, image_url: u("photo-1502672260266-1c1ef2d93688"), tags: ["Mobiliado"],               status: "disponivel", description: "Studio mobiliado pronto para morar, pé na vida boêmia.", broker_id: "b3", last_activity: 1 },
  { id: "p4",  title: "Sala Comercial Faria Lima",          type: "comercial",   finalidade: "aluguel", price: 15000,   bedrooms: 0, bathrooms: 2, area: 110, neighborhood: "Itaim Bibi",     city: "São Paulo", featured: false, publish: true, image_url: u("photo-1497366216548-37526070297c"), tags: ["AAA"],                     status: "disponivel", description: "Sala no coração da Faria Lima, andar alto.", broker_id: "b1", last_activity: 12 },
  { id: "p5",  title: "Terreno em Cotia",                   type: "terreno",     finalidade: "venda",   price: 380000,  bedrooms: 0, bathrooms: 0, area: 1000,neighborhood: "Granja Viana",   city: "Cotia",     featured: false, publish: true, image_url: u("photo-1500382017468-9049fed747ef"), tags: ["Aceita financiamento"],    status: "disponivel", description: "Terreno plano em condomínio fechado, escritura ok.", broker_id: "b2", last_activity: 40 },
  { id: "p6",  title: "Lançamento Vista Verde",             type: "apartamento", finalidade: "venda",   price: 620000,  bedrooms: 2, bathrooms: 2, area: 65,  neighborhood: "Vila Mariana",   city: "São Paulo", featured: true,  publish: true, image_url: u("photo-1512917774080-9991f1c4c750"), tags: ["Lançamento"],              status: "disponivel", description: "Lançamento com 30+ itens de lazer.", broker_id: "b3", last_activity: 3 },
  { id: "p7",  title: "Apto Moema 2 dorms",                 type: "apartamento", finalidade: "venda",   price: 980000,  bedrooms: 2, bathrooms: 2, area: 78,  neighborhood: "Moema",          city: "São Paulo", featured: false, publish: true, image_url: u("photo-1560448204-e02f11c3d0e2"), tags: ["Reservado"],               status: "reservado",  description: "Próximo ao metrô, infraestrutura completa.", broker_id: "b1", last_activity: 4 },
  { id: "p8",  title: "Cobertura Duplex Itaim",             type: "apartamento", finalidade: "venda",   price: 3200000, bedrooms: 4, bathrooms: 5, area: 280, neighborhood: "Itaim Bibi",     city: "São Paulo", featured: true,  publish: true, image_url: u("photo-1600585154340-be6161a56a0c"), tags: ["Alto padrão", "Piscina"],  status: "disponivel", description: "Duplex com piscina privativa e churrasqueira.", broker_id: "b2", last_activity: 7 },
  { id: "p9",  title: "Casa Vila Mariana",                  type: "casa",        finalidade: "aluguel", price: 7500,    bedrooms: 3, bathrooms: 2, area: 180, neighborhood: "Vila Mariana",   city: "São Paulo", featured: false, publish: true, image_url: u("photo-1570129477492-45c003edd2be"), tags: ["Quintal"],                 status: "disponivel", description: "Casa térrea com quintal grande, ideal família.", broker_id: "b3", last_activity: 35 },
  { id: "p10", title: "Galpão Logístico Guarulhos",         type: "comercial",   finalidade: "aluguel", price: 25000,   bedrooms: 0, bathrooms: 2, area: 1200,neighborhood: "Cumbica",        city: "Guarulhos", featured: false, publish: true, image_url: u("photo-1565793979206-2bf81e3b4b91"), tags: ["Pé direito 10m"],          status: "disponivel", description: "Galpão próximo ao aeroporto, doca, estacionamento.", broker_id: "b1", last_activity: 22 },
];

const today = Date.now();
const days = (n: number) => new Date(today - n * 86400000).toISOString();

export const demoLeads = [
  { id: "l01", name: "Carlos Mendes",   phone: "(11) 99999-1111", interest: "Apto Jardins até R$2M",       value_min: 1500000, value_max: 2000000, broker_id: "b1", stage: "lead_novo",        tag: "novo",   source: "Vitrine",       last_contact: days(0)  },
  { id: "l02", name: "Marina Costa",    phone: "(11) 98888-2222", interest: "Casa Alphaville",              value_min: 2000000, value_max: 3000000, broker_id: "b2", stage: "lead_novo",        tag: "morno",  source: "Instagram",     last_contact: days(1)  },
  { id: "l03", name: "Rafael Lima",     phone: "(11) 97777-3333", interest: "Studio Vila Madalena",         value_min: 3000,    value_max: 5000,    broker_id: "b3", stage: "contato_iniciado", tag: "quente", source: "Google",        last_contact: days(0)  },
  { id: "l04", name: "Beatriz Souza",   phone: "(21) 96666-4444", interest: "Sala Faria Lima",              value_min: 12000,   value_max: 18000,   broker_id: "b1", stage: "contato_iniciado", tag: "morno",  source: "WhatsApp",      last_contact: days(2)  },
  { id: "l05", name: "João Pereira",    phone: "(11) 95555-5555", interest: "Terreno Cotia",                value_min: 300000,  value_max: 500000,  broker_id: "b2", stage: "qualificado",      tag: "quente", source: "Indicação",     last_contact: days(1)  },
  { id: "l06", name: "Ana Ribeiro",     phone: "(11) 94444-6666", interest: "Lançamento Vista Verde",       value_min: 500000,  value_max: 700000,  broker_id: "b3", stage: "qualificado",      tag: "morno",  source: "Site",          last_contact: days(3)  },
  { id: "l07", name: "Pedro Almeida",   phone: "(11) 93333-7777", interest: "Cobertura Itaim",              value_min: 2800000, value_max: 3500000, broker_id: "b1", stage: "visita_marcada",   tag: "quente", source: "Facebook",      last_contact: days(0)  },
  { id: "l08", name: "Juliana Castro",  phone: "(11) 92222-8888", interest: "Apto Moema",                   value_min: 800000,  value_max: 1100000, broker_id: "b2", stage: "visita_marcada",   tag: "quente", source: "Vitrine",       last_contact: days(1)  },
  { id: "l09", name: "Fernando Dias",   phone: "(11) 91111-9999", interest: "Casa Vila Mariana aluguel",    value_min: 6000,    value_max: 9000,    broker_id: "b3", stage: "visita_realizada", tag: "morno",  source: "Google",        last_contact: days(2)  },
  { id: "l10", name: "Camila Rocha",    phone: "(11) 90000-1010", interest: "Galpão Guarulhos",             value_min: 20000,   value_max: 30000,   broker_id: "b1", stage: "visita_realizada", tag: "frio",   source: "Indicação",     last_contact: days(4)  },
  { id: "l11", name: "Roberto Vieira",  phone: "(11) 98765-1212", interest: "Casa Alphaville",              value_min: 2200000, value_max: 2600000, broker_id: "b2", stage: "proposta_enviada", tag: "quente", source: "Site",          last_contact: days(1)  },
  { id: "l12", name: "Patrícia Nunes",  phone: "(11) 97654-3434", interest: "Apto Jardins",                 value_min: 1700000, value_max: 1900000, broker_id: "b3", stage: "negociacao",       tag: "quente", source: "Vitrine",       last_contact: days(0)  },
  { id: "l13", name: "Eduardo Pinto",   phone: "(11) 96543-5656", interest: "Studio Vila Madalena aluguel", value_min: 3500,    value_max: 4500,    broker_id: "b1", stage: "fechado",          tag: "quente", source: "Instagram",     last_contact: days(8)  },
  { id: "l14", name: "Larissa Mota",    phone: "(11) 95432-7878", interest: "Apto Moema",                   value_min: 850000,  value_max: 1000000, broker_id: "b2", stage: "fechado",          tag: "quente", source: "Indicação",     last_contact: days(15) },
  { id: "l15", name: "Bruno Cardoso",   phone: "(11) 94321-9090", interest: "Cobertura Itaim",              value_min: 2500000, value_max: 3000000, broker_id: "b3", stage: "perdido",          tag: "frio",   source: "Google",        last_contact: days(20), lost_reason: "Optou por concorrente" },
];

export const demoVisits = [
  { id: "v1", lead_name: "Pedro Almeida",   property: "Cobertura Duplex Itaim",       broker: "Rafael Mendes",  scheduled_at: days(-2), status: "agendada" },
  { id: "v2", lead_name: "Juliana Castro",  property: "Apto Moema 2 dorms",           broker: "Carla Oliveira", scheduled_at: days(-1), status: "agendada" },
  { id: "v3", lead_name: "Marina Costa",    property: "Casa em Alphaville",           broker: "Carla Oliveira", scheduled_at: days(-3), status: "agendada" },
  { id: "v4", lead_name: "Fernando Dias",   property: "Casa Vila Mariana",            broker: "Thiago Santos",  scheduled_at: days(2),  status: "concluida", feedback: "Cliente amou o quintal, vai trazer esposa.", followup_done: true },
  { id: "v5", lead_name: "Camila Rocha",    property: "Galpão Logístico Guarulhos",   broker: "Rafael Mendes",  scheduled_at: days(4),  status: "concluida", feedback: "Achou pé-direito baixo para empilhadeira.",    followup_done: true },
  { id: "v6", lead_name: "Roberto Vieira",  property: "Casa em Alphaville",           broker: "Carla Oliveira", scheduled_at: days(1),  status: "concluida", feedback: "Vai enviar proposta na semana.",                followup_done: false },
  { id: "v7", lead_name: "Ana Ribeiro",     property: "Lançamento Vista Verde",       broker: "Thiago Santos",  scheduled_at: days(-5), status: "remarcada" },
  { id: "v8", lead_name: "Beatriz Souza",   property: "Sala Comercial Faria Lima",    broker: "Rafael Mendes",  scheduled_at: days(7),  status: "concluida", feedback: "Achou caro o m².",                              followup_done: false },
];

export const demoProposals = [
  { id: "pr1", lead_name: "Roberto Vieira",  property: "Casa em Alphaville",  value: 2350000, status: "enviada",    sent_at: days(1)  },
  { id: "pr2", lead_name: "Patrícia Nunes",  property: "Apto Jardins",        value: 1780000, status: "negociacao", sent_at: days(2)  },
  { id: "pr3", lead_name: "Eduardo Pinto",   property: "Studio Vila Madalena",value: 4000,    status: "aceita",     sent_at: days(8)  },
  { id: "pr4", lead_name: "Larissa Mota",    property: "Apto Moema",          value: 920000,  status: "aceita",     sent_at: days(15) },
  { id: "pr5", lead_name: "Bruno Cardoso",   property: "Cobertura Itaim",     value: 2700000, status: "recusada",   sent_at: days(18) },
  { id: "pr6", lead_name: "Ana Ribeiro",     property: "Lançamento Vista Verde", value: 590000, status: "em_analise", sent_at: days(5) },
];

export const demoCommissions = [
  { id: "c1", broker: "Rafael Mendes",  deal: "Studio Vila Madalena",  value: 2400,   status: "recebida", date: days(7)  },
  { id: "c2", broker: "Carla Oliveira", deal: "Apto Moema",            value: 46000,  status: "recebida", date: days(15) },
  { id: "c3", broker: "Carla Oliveira", deal: "Casa em Alphaville",    value: 117500, status: "prevista", date: days(-15) },
  { id: "c4", broker: "Thiago Santos",  deal: "Lançamento Vista Verde",value: 29500,  status: "prevista", date: days(-10) },
];

export const demoCosts = [
  { id: "co1", description: "Anúncios Google + Meta Ads",   category: "marketing",  amount: 4800,  date: days(2)  },
  { id: "co2", description: "Plataforma ImobFlow Pro",      category: "plataforma", amount: 199,   date: days(1)  },
  { id: "co3", description: "Aluguel escritório Jardins",   category: "escritorio", amount: 8500,  date: days(3)  },
  { id: "co4", description: "Honorários jurídicos",         category: "juridico",   amount: 3200,  date: days(5)  },
  { id: "co5", description: "Folha corretores comissionada",category: "folha",      amount: 24000, date: days(4)  },
];

export const aiInsights = {
  forgotten_leads: [
    { id: "l15", name: "Bruno Cardoso", days_since: 20, suggestion: "Reativar via WhatsApp com proposta no orçamento dele" },
    { id: "l14", name: "Larissa Mota",  days_since: 15, suggestion: "Já fechou — pedir indicação" },
    { id: "l10", name: "Camila Rocha",  days_since: 4,  suggestion: "Oferecer galpão alternativo com pé-direito maior" },
  ],
  visits_without_followup: [
    { id: "v6", lead: "Roberto Vieira",  days_since: 1, suggestion: "Confirmar envio da proposta prometido" },
    { id: "v8", lead: "Beatriz Souza",   days_since: 7, suggestion: "Sugerir sala menor no mesmo prédio" },
  ],
  stalled_proposals: [
    { id: "pr1", lead: "Roberto Vieira",  days_since: 1, suggestion: "Cobrar resposta — proposta válida 7d" },
    { id: "pr6", lead: "Ana Ribeiro",     days_since: 5, suggestion: "Oferecer condição especial para fechar" },
  ],
  low_activity_properties: [
    { id: "p5",  title: "Terreno em Cotia",        days_since: 40, suggestion: "Revisar preço — 12% acima do mercado" },
    { id: "p9",  title: "Casa Vila Mariana",       days_since: 35, suggestion: "Marcar como destaque na vitrine"      },
    { id: "p10", title: "Galpão Guarulhos",        days_since: 22, suggestion: "Re-fotografar com drone"              },
  ],
};

export const funnelData = [
  { stage: "Leads",        value: 247 },
  { stage: "Qualificados", value: 142 },
  { stage: "Visitas",      value: 68  },
  { stage: "Propostas",    value: 31  },
  { stage: "Fechamentos",  value: 12  },
];
export const propertyTypeData = [
  { name: "Apartamento", value: 5 }, { name: "Casa", value: 2 }, { name: "Comercial", value: 2 }, { name: "Terreno", value: 1 }, { name: "Outros", value: 0 },
];

export const brl = (n: number) =>
  n >= 1_000_000 ? `R$ ${(n / 1_000_000).toFixed(2)}M` :
  n >= 10_000   ? `R$ ${(n / 1000).toFixed(0)}k` :
  n >= 1_000    ? `R$ ${(n / 1000).toFixed(1)}k` :
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

