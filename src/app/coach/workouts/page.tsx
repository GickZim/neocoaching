"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/toast";
import { WorkoutPlan } from "@/types/workout";
import AssignClientModal from "@/components/AssignClientModal";
import { Plus, Dumbbell, FileText, Users, Archive, Clock, Target, Edit, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function CoachWorkoutsPage() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [assignModal, setAssignModal] = useState<{ open: boolean; planId: string }>({ open: false, planId: "" });
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { load(); }, [showArchived]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_plans").select("*").eq("archived", showArchived)
      .order("created_at", { ascending: false });
    if (error) showToast(error.message, "error");
    else setPlans(data || []);
    setLoading(false);
  }

  async function archivePlan(id: string, archive: boolean) {
    const { error } = await supabase.from("workout_plans").update({ archived: archive }).eq("id", id);
    if (error) { showToast(error.message, "error"); return; }
    showToast(archive ? "Plan archived." : "Plan restored.", "success");
    load();
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this plan permanently?")) return;
    const { error } = await supabase.from("workout_plans").delete().eq("id", id);
    if (error) { showToast(error.message, "error"); return; }
    showToast("Plan deleted.", "success");
    setPlans(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="section-label mb-2">Coach Portal</p>
          <h1 className="text-3xl font-black">Workout Library</h1>
          <p className="text-white/35 text-sm mt-1">Create, manage and assign workout programs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowArchived(a => !a)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showArchived ? "border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/8" : "border-white/8 text-white/50 hover:text-white"}`}>
            <Archive size={14} className="inline mr-1.5" />{showArchived ? "Show Active" : "Archived"}
          </button>
          <Link href="/coach/workouts/new" className="btn-gold flex items-center gap-2 text-sm px-5 py-2.5">
            <Plus size={16} /> New Plan
          </Link>
        </div>
      </div>

      {loading && <div className="grid lg:grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-52 rounded-2xl"/>)}</div>}

      {!loading && plans.length === 0 && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-16 text-center">
          <Dumbbell size={40} className="text-white/10 mx-auto mb-4"/>
          <h3 className="text-lg font-bold mb-2">No workout plans yet</h3>
          <p className="text-white/30 text-sm mb-6">Create your first workout plan to assign to clients.</p>
          <Link href="/coach/workouts/new" className="btn-gold inline-flex items-center gap-2 text-sm"><Plus size={15}/>Create First Plan</Link>
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4,delay:i*0.06}}
              className="bg-[#0a0a0a] border border-white/6 hover:border-[#D4AF37]/20 rounded-2xl p-6 transition-all duration-200 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-black"/>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-white truncate">{plan.title}</h2>
                    {plan.goal && <p className="text-[#D4AF37] text-xs mt-0.5">{plan.goal}</p>}
                  </div>
                </div>
                <div className="relative shrink-0">
                  <button onClick={() => setMenuOpen(menuOpen===plan.id?null:plan.id)}
                    className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition">
                    <MoreVertical size={16}/>
                  </button>
                  {menuOpen === plan.id && (
                    <div className="absolute right-0 top-9 w-44 bg-[#111] border border-white/8 rounded-xl shadow-2xl z-20 overflow-hidden">
                      {[
                        {label:"Edit Plan", action:()=>{window.location.href=`/coach/workouts/${plan.id}`;}},
                        {label:"Assign Clients", action:()=>{setAssignModal({open:true,planId:plan.id});setMenuOpen(null);}},
                        {label:plan.archived?"Restore":"Archive", action:()=>{archivePlan(plan.id,!plan.archived);setMenuOpen(null);}},
                        {label:"Delete", action:()=>{deletePlan(plan.id);setMenuOpen(null);}, danger:true},
                      ].map(({label,action,danger}:{label:string;action:()=>void;danger?:boolean})=>(
                        <button key={label} onClick={action}
                          className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/4 ${danger?"text-red-400":"text-white/70 hover:text-white"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {plan.description && <p className="text-white/40 text-sm mb-4 line-clamp-2">{plan.description}</p>}

              <div className="flex flex-wrap gap-2 mb-5">
                {plan.duration_weeks && <span className="flex items-center gap-1.5 text-xs text-white/40 bg-white/4 border border-white/6 rounded-lg px-2.5 py-1.5"><Clock size={11}/>{plan.duration_weeks}w program</span>}
                {plan.goal && <span className="flex items-center gap-1.5 text-xs text-white/40 bg-white/4 border border-white/6 rounded-lg px-2.5 py-1.5"><Target size={11}/>{plan.goal}</span>}
                {plan.pdf_url && <span className="flex items-center gap-1.5 text-xs text-white/40 bg-white/4 border border-white/6 rounded-lg px-2.5 py-1.5"><FileText size={11}/>PDF attached</span>}
              </div>

              <div className="flex gap-2">
                <Link href={`/coach/workouts/${plan.id}`}
                  className="flex-1 text-center py-2.5 rounded-xl bg-white/4 border border-white/6 hover:border-white/12 text-sm font-semibold text-white/70 hover:text-white transition flex items-center justify-center gap-1.5">
                  <Edit size={13}/> Edit
                </Link>
                <button onClick={()=>setAssignModal({open:true,planId:plan.id})}
                  className="flex-1 btn-gold text-sm py-2.5 flex items-center justify-center gap-1.5">
                  <Users size={14}/> Assign
                </button>
                {plan.pdf_url && (
                  <a href={plan.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/6 hover:border-white/12 text-white/50 hover:text-white transition">
                    <FileText size={15}/>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AssignClientModal open={assignModal.open} onClose={()=>setAssignModal({open:false,planId:""})}
        itemId={assignModal.planId} assignmentTable="client_workouts" assignmentField="workout_id"/>
      {menuOpen && <div className="fixed inset-0 z-10" onClick={()=>setMenuOpen(null)}/>}
    </div>
  );
}
