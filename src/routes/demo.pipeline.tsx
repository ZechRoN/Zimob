import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Flame, Snowflake, Sparkles, TrendingUp } from "lucide-react";
import { demoLeads, demoBrokers, PIPELINE_STAGES, TAG_COLORS, brl } from "@/lib/demo-data";

export const Route = createFileRoute("/demo/pipeline")({ component: PipelineDemo });

const TAG_ICONS: Record<string, any> = { quente: Flame, morno: TrendingUp, frio: Snowflake, novo: Sparkles };

function PipelineDemo() {
  const [leads, setLeads] = useState(demoLeads.map((l) => ({ ...l })));
  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return;
    setLeads((old) => old.map((l) => l.id === r.draggableId ? { ...l, stage: r.destination!.droppableId } : l));
  };
  const totalGmv = leads.filter((l) => l.stage !== "perdido").reduce((s:number, l) => s + l.value_max, 0);

  return (
    <div className="-m-4 md:-m-6 p-4 md:p-6 min-h-screen bg-app-bg text-app-text space-y-5">
      {/* Cinematic header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="app-hero relative overflow-hidden rounded-2xl border border-app-border p-6 flex items-end justify-between gap-6 flex-wrap">
        <div className="absolute inset-0 opacity-30 app-grid-bg pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary blue-pulse" />Pipeline · Tempo real
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
            Pipeline <span className="text-primary-gradient">Comercial</span>
          </h1>
          <p className="mt-1 text-sm text-app-text-muted">
            {leads.filter((l) => l.stage !== "fechado" && l.stage !== "perdido").length} oportunidades · GMV potencial <span className="text-primary font-semibold">{brl(totalGmv)}</span>
          </p>
        </div>
        <div className="relative flex gap-2 text-[10px] uppercase tracking-[0.2em]">
          {(["quente","morno","frio","novo"] as const).map((t) => {
            const c = TAG_COLORS[t];
            const count = leads.filter((l) => l.tag === t).length;
            const Icon = TAG_ICONS[t];
            return (
              <div key={t} className="px-3 py-2 rounded-lg border border-app-border bg-app-card flex items-center gap-2">
                <Icon className="h-3 w-3" style={{ color: c.color }} />
                <span className="text-app-text-muted">{t}</span>
                <span className="font-bold text-app-text">{count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
          {PIPELINE_STAGES.map((stage, si) => {
            const items = leads.filter((l) => l.stage === stage.id);
            return (
              <Droppable droppableId={stage.id} key={stage.id}>
                {(provided, snapshot) => (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
                    className="w-80 flex-shrink-0">
                    {/* Stage header */}
                    <div className="flex items-center justify-between mb-2 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full blue-pulse" style={{ background: stage.color, boxShadow: `0 0 12px ${stage.color}` }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-app-text">{stage.label}</span>
                      </div>
                      <span className="min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full border border-blue-200/70 dark:border-blue-800/70 bg-blue-50 dark:bg-blue-950/35 text-primary">{items.length}</span>
                    </div>
                    {/* Column gradient track */}
                    <div className="h-[2px] mb-2 rounded-full" style={{ background: `linear-gradient(90deg, ${stage.color}, transparent)` }} />
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`min-h-[520px] rounded-xl p-3 border space-y-3 transition-all duration-300 ${snapshot.isDraggingOver ? "border-primary bg-blue-50 dark:bg-blue-950/30 blue-glow" : "border-app-border bg-app-card-2"}`}>
                      {items.map((l, idx) => {
                        const broker = demoBrokers.find((b) => b.id === l.broker_id);
                        const tc = TAG_COLORS[l.tag] ?? TAG_COLORS.novo;
                        const Icon = TAG_ICONS[l.tag] ?? Sparkles;
                        const hot = l.tag === "quente";
                        return (
                          <Draggable draggableId={l.id} index={idx} key={l.id}>
                            {(p, snap) => (
                              <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}
                                className={`relative bg-app-card border rounded-xl p-4 cursor-grab transition-all duration-300 group shadow-sm ${snap.isDragging ? "border-primary blue-glow-strong scale-[1.02] rotate-1" : "border-app-border hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5"}`}>
                                {hot && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary blue-pulse" />}
                                <div className="text-base font-semibold text-app-text truncate">{l.name}</div>
                                <div className="text-xs text-app-text-muted truncate mt-1">{l.interest}</div>
                                <div className="mt-3 rounded-lg border border-app-border bg-app-card-2 px-3 py-2 text-[11px] text-app-text-muted">
                                  <div className="flex justify-between gap-3"><span>Origem</span><span className="font-semibold text-app-text">{l.source}</span></div>
                                  <div className="mt-1 flex justify-between gap-3"><span>Faixa</span><span className="font-semibold text-primary">{brl(l.value_min)} – {brl(l.value_max)}</span></div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0"
                                          style={{ background: "var(--gradient-blue)" }}>{broker?.name[0] ?? "?"}</span>
                                    <span className="text-xs text-app-text-muted truncate">{broker?.name.split(" ")[0]}</span>
                                  </div>
                                  <span className="text-[11px] text-app-text-soft">últ. contato</span>
                                </div>
                                <div className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                                     style={{ background: tc.bg + "20", color: tc.color, borderColor: tc.color + "44" }}>
                                  <Icon className="h-2.5 w-2.5" /> {l.tag}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </motion.div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

