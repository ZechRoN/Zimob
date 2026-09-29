import { type ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function FormDialog({ title, trigger, children, open: openProp, onOpenChange }: {
  title: string;
  trigger?: ReactNode;
  children: (close: () => void) => ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [uOpen, setUOpen] = useState(false);
  const open = openProp ?? uOpen;
  const setOpen = onOpenChange ?? setUOpen;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined && (
        <DialogTrigger asChild>
          {trigger ?? (<Button className="bg-brand text-brand-foreground"><Plus className="h-4 w-4 mr-1" />Novo</Button>)}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}

