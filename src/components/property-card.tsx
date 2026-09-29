import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { Bed, Bath, Square, MapPin } from "lucide-react";

type P = {
  id: string;
  title: string;
  price: number;
  city?: string | null;
  neighborhood?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_useful?: number | null;
  transaction?: string | null;
  status?: string | null;
  photos?: string[] | null;
};

export function PropertyCard({ property, onClick }: { property: P; onClick?: () => void }) {
  const photo = property.photos?.[0];
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition" onClick={onClick}>
      <div className="aspect-video bg-muted relative">
        {photo ? (
          <img src={photo} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Sem foto</div>
        )}
        {property.transaction && (
          <Badge className="absolute top-2 left-2 bg-brand text-brand-foreground">
            {property.transaction === "venda" ? "Venda" : property.transaction === "aluguel" ? "Aluguel" : "Temporada"}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-1">{property.title}</h3>
        {(property.neighborhood || property.city) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {[property.neighborhood, property.city].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {!!property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {property.bedrooms}</span>}
          {!!property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {property.bathrooms}</span>}
          {!!property.area_useful && <span className="flex items-center gap-1"><Square className="h-3 w-3" /> {property.area_useful}m²</span>}
        </div>
        <div className="text-xl font-bold text-brand">{brl(property.price)}</div>
      </div>
    </Card>
  );
}
