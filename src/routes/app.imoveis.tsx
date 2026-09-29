import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/page-header";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/app/imoveis")({ component: Imoveis });

function Imoveis() {
  const { data: cu } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);const[editing,setEditing]=useState<any>(null);const[photo,setPhoto]=useState<File|null>(null);
  const q = useQuery({
    queryKey: ["imoveis", cu?.company?.id],
    enabled: !!cu?.company?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("property").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async (f: any) => {
      let photos=editing?.photos||[];if(photo){const path=crypto.randomUUID();const up=await supabase.storage.from('property-photos').upload(path,photo);if(up.error)throw up.error;photos=[...photos,supabase.storage.from('property-photos').getPublicUrl(path).data.publicUrl]}
      const payload={
        company_id: cu!.company.id, title: f.title, price: Number(f.price), type: f.type, transaction: f.transaction,
        photos,status:f.status||"disponivel",description:f.description,city: f.city, neighborhood: f.neighborhood, bedrooms: Number(f.bedrooms || 0), bathrooms: Number(f.bathrooms || 0),
        area_useful: Number(f.area_useful || 0), address: { city: f.city, neighborhood: f.neighborhood }, slug: slugify(f.title),
      };const {error}=editing?await supabase.from('property').update(payload).eq('id',editing.id):await supabase.from('property').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Imóvel salvo"); setOpen(false); qc.invalidateQueries({ queryKey: ["imoveis"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Imóveis" description={`${q.data?.length ?? 0} imóveis cadastrados`} actions={
        <Dialog open={open} onOpenChange={o=>{setOpen(o);if(!o){setEditing(null);setPhoto(null)}}}>
          <DialogTrigger asChild><Button onClick={()=>{setEditing(null);setPhoto(null)}} className="bg-brand text-brand-foreground"><Plus className="h-4 w-4" />Novo imóvel</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?"Editar imóvel":"Novo imóvel"}</DialogTitle></DialogHeader>
            <form key={editing?.id||"new"} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); create.mutate(Object.fromEntries(fd)); }} className="space-y-3">
              <div><Label>Título</Label><Input defaultValue={editing?.title??""} name="title" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tipo</Label>
                  <Select name="type" defaultValue={editing?.type||"apartamento"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="apartamento">Apartamento</SelectItem><SelectItem value="casa">Casa</SelectItem>
                    <SelectItem value="terreno">Terreno</SelectItem><SelectItem value="comercial">Comercial</SelectItem><SelectItem value="rural">Rural</SelectItem>
                  </SelectContent></Select>
                </div>
                <div><Label>Transação</Label>
                  <Select name="transaction" defaultValue={editing?.transaction||"venda"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="venda">Venda</SelectItem><SelectItem value="aluguel">Aluguel</SelectItem><SelectItem value="temporada">Temporada</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div><Label>Preço (R$)</Label><Input defaultValue={editing?.price??""} name="price" type="number" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cidade</Label><Input defaultValue={editing?.city??""} name="city" /></div>
                <div><Label>Bairro</Label><Input defaultValue={editing?.neighborhood??""} name="neighborhood" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Dorms</Label><Input defaultValue={editing?.bedrooms??""} name="bedrooms" type="number" /></div>
                <div><Label>Banhos</Label><Input defaultValue={editing?.bathrooms??""} name="bathrooms" type="number" /></div>
                <div><Label>Área (m²)</Label><Input defaultValue={editing?.area_useful??""} name="area_useful" type="number" /></div>
              </div>
              <div><Label>Descrição</Label><Input name="description" defaultValue={editing?.description||''}/></div>
              <div><Label>Status</Label><select name="status" defaultValue={editing?.status||'disponivel'} className="w-full border rounded p-2 bg-background">{['disponivel','reservado','vendido','alugado','inativo'].map(x=><option key={x}>{x}</option>)}</select></div>
              <div><Label>Adicionar foto (até 5 MB)</Label><Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></div>
              <Button type="submit" className="w-full bg-brand text-brand-foreground" disabled={create.isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(q.data ?? []).map((p: any) => <div key={p.id}><PropertyCard property={p}/><Button variant="outline" className="mt-2 w-full" onClick={()=>{setEditing(p);setOpen(true)}}>Editar imóvel</Button></div>)}
      </div>
    </div>
  );
}
