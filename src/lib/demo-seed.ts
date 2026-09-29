export const demoCompany = { id: "demo-co", name: "Imobiliária Demo SP", trial_ate: null };

export const demoProperties = [
  { id: "p1", title: "Apartamento 3 dorms Pinheiros", price: 1290000, transaction: "venda", type: "apartamento", city: "São Paulo", neighborhood: "Pinheiros", bedrooms: 3, bathrooms: 2, area_useful: 95, parking: 2, status: "disponivel", photos: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"] },
  { id: "p2", title: "Cobertura Vila Madalena com piscina", price: 2890000, transaction: "venda", type: "apartamento", city: "São Paulo", neighborhood: "Vila Madalena", bedrooms: 4, bathrooms: 4, area_useful: 220, parking: 3, status: "disponivel", photos: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"] },
  { id: "p3", title: "Casa Alphaville 4 suítes piscina", price: 3500000, transaction: "venda", type: "casa", city: "Barueri", neighborhood: "Alphaville", bedrooms: 4, bathrooms: 5, area_useful: 380, parking: 4, status: "disponivel", photos: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"] },
  { id: "p4", title: "Studio Itaim Bibi mobiliado", price: 4500, transaction: "aluguel", type: "apartamento", city: "São Paulo", neighborhood: "Itaim Bibi", bedrooms: 1, bathrooms: 1, area_useful: 35, parking: 1, status: "disponivel", photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"] },
  { id: "p5", title: "Apto 2 dorms Copacabana vista mar", price: 1690000, transaction: "venda", type: "apartamento", city: "Rio de Janeiro", neighborhood: "Copacabana", bedrooms: 2, bathrooms: 2, area_useful: 78, parking: 1, status: "disponivel", photos: ["https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800"] },
  { id: "p6", title: "Casa Jardins reformada", price: 4800000, transaction: "venda", type: "casa", city: "São Paulo", neighborhood: "Jardins", bedrooms: 5, bathrooms: 4, area_useful: 420, parking: 4, status: "disponivel", photos: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"] },
];

export const demoLeads = [
  { id: "l1", name: "Carlos Mendes", phone: "(11) 99999-1111", email: "carlos@example.com", source: "whatsapp", status: "novo", budget_max: 1500000, neighborhoods: ["Pinheiros"], bedrooms_min: 2 },
  { id: "l2", name: "Marina Costa", phone: "(11) 98888-2222", email: "marina@example.com", source: "instagram", status: "em_atendimento", budget_max: 3000000, neighborhoods: ["Vila Madalena", "Pinheiros"], bedrooms_min: 3 },
  { id: "l3", name: "Rafael Lima", phone: "(11) 97777-3333", email: "rafael@example.com", source: "site", status: "qualificado", budget_max: 4000000, neighborhoods: ["Alphaville"], bedrooms_min: 4 },
  { id: "l4", name: "Beatriz Souza", phone: "(21) 96666-4444", email: "bia@example.com", source: "google", status: "visita_marcada", budget_max: 1800000, neighborhoods: ["Copacabana"], bedrooms_min: 2 },
  { id: "l5", name: "João Pereira", phone: "(11) 95555-5555", email: "joao@example.com", source: "indicacao", status: "proposta", budget_max: 5000000, neighborhoods: ["Jardins"], bedrooms_min: 5 },
  { id: "l6", name: "Ana Ribeiro", phone: "(11) 94444-6666", email: "ana@example.com", source: "facebook", status: "fechado", budget_max: 1300000, neighborhoods: ["Pinheiros"], bedrooms_min: 3 },
  { id: "l7", name: "Pedro Almeida", phone: "(11) 93333-7777", email: "pedro@example.com", source: "outro", status: "perdido", budget_max: 800000, neighborhoods: [], bedrooms_min: 2, lost_reason: "fora do orçamento" },
];

export const demoVisits = [
  { id: "v1", property_title: "Apartamento 3 dorms Pinheiros", lead_name: "Carlos Mendes", scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: "agendada", corretor_nome: "Renata Silva" },
  { id: "v2", property_title: "Cobertura Vila Madalena", lead_name: "Marina Costa", scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(), status: "agendada", corretor_nome: "Renata Silva" },
  { id: "v3", property_title: "Apto Copacabana", lead_name: "Beatriz Souza", scheduled_at: new Date(Date.now() - 86400000).toISOString(), status: "realizada", corretor_nome: "Felipe Costa", feedback: "Cliente gostou muito" },
];

export const demoProposals = [
  { id: "pr1", property_title: "Casa Jardins reformada", lead_name: "João Pereira", value: 4700000, status: "em_analise", payment_terms: "Entrada 30% + financiamento" },
  { id: "pr2", property_title: "Apto Pinheiros", lead_name: "Ana Ribeiro", value: 1250000, status: "aceita", payment_terms: "À vista" },
];

export const demoCosts = [
  { id: "c1", description: "Aluguel escritório", category: "fixo", amount: 8500, date: new Date().toISOString().slice(0, 10), payment_status: "pago" },
  { id: "c2", description: "Anúncios Google Ads", category: "marketing", amount: 3200, date: new Date().toISOString().slice(0, 10), payment_status: "pago" },
  { id: "c3", description: "Folha de pagamento", category: "fixo", amount: 24000, date: new Date().toISOString().slice(0, 10), payment_status: "pago" },
];

export const demoRevenues = [
  { id: "r1", description: "Comissão venda Ana Ribeiro", category: "comissao", amount: 75000, date: new Date().toISOString().slice(0, 10), payment_status: "pago" },
  { id: "r2", description: "Comissão venda apto Itaim", category: "comissao", amount: 42000, date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), payment_status: "pago" },
];
