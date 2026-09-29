import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

interface Props {
  slug?: string | null;
  companyName?: string;
  className?: string;
}

export function BookingLinkCard({ slug, companyName, className }: Props) {
  if (!slug) return null;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/imoveis/${slug}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };
  return (
    <Card className={className}>
      <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-app-card p-3 rounded-md border shrink-0">
          <QRCodeCanvas value={url} size={108} level="M" />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <QrCode className="h-3 w-3" /> Vitrine pública
          </div>
          <div className="font-semibold mt-0.5 truncate">{companyName ?? "Sua imobiliária"}</div>
          <div className="text-xs text-muted-foreground font-mono mt-1 truncate" title={url}>{url}</div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={copy}><Copy className="h-3.5 w-3.5 mr-1.5" />Copiar</Button>
            <a href={url} target="_blank" rel="noreferrer">
              <Button size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Abrir</Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
