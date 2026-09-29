import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className={
        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-card text-app-text transition-all hover:border-blue-400 dark:hover:border-blue-600 hover:text-primary " +
        className
      }
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
