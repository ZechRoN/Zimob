import { cn } from '@/lib/utils'

export function ZimobBrand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <img src={compact ? '/brand/zimob-symbol.png' : '/brand/zimob-logo.png'} alt="Zimob" width={compact ? 263 : 943} height={293}
    className={cn(compact ? 'h-9 w-8 shrink-0 object-contain' : 'h-11 w-auto max-w-full object-contain dark:rounded-lg dark:bg-white dark:p-1.5', className)} />
}
