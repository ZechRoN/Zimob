import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";


import { z } from "zod";
import { callBackend } from "@/blink/backend";

import { PropertyCard } from "@/components/property-card";
import { Building2 } from "lucide-react";

const loadVitrineMeta=async({data}:any)=>{const r=await callBackend('/api/public',{action:'catalog',slug:data.slug});return{company:r.company,firstPhoto:r.properties[0]?.photos?.[0]||null}};
export const Route = createFileRoute("/vitrine/$slug")({
  loader: ({ params }) => loadVitrineMeta({ data: { slug: params.slug } }),
  head: ({ loaderData, params }) => {
    const title = loaderData?.company ? `Imóveis — ${loaderData.company.name}` : `Imóveis — ${params.slug}`;
    const desc = loaderData?.company ? `Confira os imóveis disponíveis da ${loaderData.company.name}.` : "Confira os imóveis disponíveis.";
    const img = loaderData?.firstPhoto ?? null;
    const meta: any[] = [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "website" }, { property: "og:url", content: `/vitrine/${params.slug}` },
    ];
    if (img) { meta.push({ property: "og:image", content: img }, { name: "twitter:image", content: img }, { name: "twitter:card", content: "summary_large_image" }); }
    return {
      meta,
      links: [
        { rel: "canonical", href: `/vitrine/${params.slug}` },
      ],
    };
  },
  component: Vitrine,
});

function Vitrine() {
  const { slug } = Route.useParams();
  const q = useQuery({
    queryKey: ["vitrine", slug],
    queryFn: async () => callBackend('/api/public',{action:'catalog',slug}),
  });
  if (q.isLoading) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  if (!q.data?.company) return <div className="p-12 text-center">Imobiliária não encontrada.</div>;
  return (<div className="min-h-screen bg-surface">
    <header className="border-b bg-background"><div className="container mx-auto px-4 h-16 flex items-center gap-3">
      {q.data.company.logo_url
        ? <img src={q.data.company.logo_url} alt={q.data.company.name} className="h-8" />
        : <div className="h-8 w-8 rounded-md bg-brand text-brand-foreground flex items-center justify-center"><Building2 className="h-4 w-4" /></div>}
      <span className="font-semibold">{q.data.company.name}</span>
    </div></header>
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Imóveis disponíveis</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {q.data.properties.map((p: any) => (
          <Link key={p.id} to="/imovel/$slug/$id" params={{ slug, id: p.id }}><PropertyCard property={p} /></Link>
        ))}
      </div>
    </main>
  </div>);
}
