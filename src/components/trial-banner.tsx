import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock } from "lucide-react";

export function TrialBanner({ trialDaysLeft, isSuspended }: { trialDaysLeft: number | null; isSuspended: boolean }) {
  if (isSuspended) {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center justify-between">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Acesso suspenso. Fale com o administrador.</span>
        <Link to="/app/plano" className="underline">Regularizar</Link>
      </div>
    );
  }
  if (trialDaysLeft === null) return null;
  if (trialDaysLeft < 0) {
    return (
      <div className="bg-orange-500 text-primary-foreground px-4 py-2 text-sm flex items-center justify-between">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Seu período de teste terminou. Fale com o administrador.</span>
        <Link to="/app/plano" className="underline">Ver planos</Link>
      </div>
    );
  }
  if (trialDaysLeft <= 3) {
    return (
      <div className="bg-yellow-400 text-yellow-950 px-4 py-2 text-sm flex items-center justify-between">
        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Seu trial termina em {trialDaysLeft} dia(s).</span>
        <Link to="/app/plano" className="underline">Ver plano</Link>
      </div>
    );
  }
  return null;
}
