// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type AppConfigRow = {
  appName: string | null
  createdAt: string
  id: string
  superAdminEmails: string
  systemSettings: string | null
  updatedAt: string
}

export type CommissionRow = {
  companyId: string
  corretorId: string
  corretorNome: string | null
  createdAt: string
  date: string
  id: string
  notes: string | null
  paymentStatus: string
  percentage: number | string | null
  propertyId: string | null
  proposalId: string | null
  updatedAt: string
  value: number | string
}

export type CompanyRow = {
  cnpj: string | null
  corPrimaria: string | null
  createdAt: string
  creci: string | null
  email: string | null
  endereco: string | null
  id: string
  logoUrl: string | null
  name: string
  ownerEmail: string | null
  ownerNome: string | null
  ownerTelefone: string | null
  plano: string
  settings: string
  slug: string | null
  status: string
  telefone: string | null
  trialAte: string | null
  updatedAt: string
}

export type CompanyUserRow = {
  ativo: boolean
  comissaoPct: number | string
  companyId: string
  createdAt: string
  creci: string | null
  email: string
  id: string
  mustChangePassword: boolean
  nome: string | null
  role: string
  ultimoLogin: string | null
  updatedAt: string
  userId: string | null
}

export type LeadRow = {
  assignedTo: string | null
  bedroomsMin: number | string | null
  budgetMax: number | string | null
  companyId: string
  createdAt: string
  email: string | null
  id: string
  interestPropertyId: string | null
  interestType: string | null
  lostReason: string | null
  name: string
  neighborhoods: string | null
  notes: string | null
  phone: string
  source: string
  status: string
  updatedAt: string
}

export type OperationalCostRow = {
  amount: number | string
  category: string | null
  companyId: string
  createdAt: string
  date: string
  description: string
  id: string
  paymentStatus: string
  recurring: boolean
  updatedAt: string
}

export type ProfilesRow = {
  userId: string
  email: string | null
}

export type PropertyRow = {
  address: string
  areaTotal: number | string | null
  areaUseful: number | string | null
  bathrooms: number | string | null
  bedrooms: number | string | null
  captadoPor: string | null
  city: string | null
  code: string | null
  companyId: string
  condoFee: number | string | null
  createdAt: string
  description: string | null
  features: string | null
  id: string
  iptu: number | string | null
  listedAt: string | null
  neighborhood: string | null
  ownerEmail: string | null
  ownerName: string | null
  ownerPhone: string | null
  parking: number | string | null
  photos: string | null
  price: number | string
  slug: string | null
  state: string | null
  status: string
  suites: number | string | null
  title: string
  transaction: string
  type: string
  updatedAt: string
  videoUrl: string | null
  zipCode: string | null
}

export type ProposalRow = {
  companyId: string
  contractUrl: string | null
  corretorId: string | null
  createdAt: string
  id: string
  leadId: string
  leadName: string | null
  observations: string | null
  paymentTerms: string | null
  propertyId: string
  propertyTitle: string | null
  status: string
  updatedAt: string
  value: number | string
}

export type RevenueRow = {
  amount: number | string
  category: string | null
  companyId: string
  createdAt: string
  date: string
  description: string
  id: string
  notes: string | null
  paymentStatus: string
  updatedAt: string
}

export type TemplateOwnerRow = {
  id: string
  userId: string
}

export type UserRolesRow = {
  companyId: string | null
  createdAt: string
  id: string
  role: string
  userId: string
}

export type VisitRow = {
  companyId: string
  corretorId: string | null
  corretorNome: string | null
  createdAt: string
  feedback: string | null
  id: string
  leadId: string | null
  leadName: string | null
  leadPhone: string | null
  notes: string | null
  propertyId: string
  propertyTitle: string | null
  scheduledAt: string
  status: string
  updatedAt: string
}

export type ZoneRow = {
  city: string | null
  companyId: string
  createdAt: string
  id: string
  name: string
  state: string | null
}
