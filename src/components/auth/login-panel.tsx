
"use client";

import React, { useState } from "react";
import { ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { OperatorLevel, OperatorSession } from "@/lib/types";

interface LoginPanelProps {
  onRegister: (data: Omit<OperatorSession, "mode">) => void;
  onSkip: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onRegister, onSkip }) => {
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    store: "FLAGSHIP_01",
    level: "OPERATOR" as OperatorLevel,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="w-full max-w-[500px] glass rounded-[2.5rem] p-10 border-white/5 aura-border shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
        <div className="absolute inset-0 shimmer opacity-5 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-xl bg-accent/20 border border-accent/40">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground font-headline">Operator Initialization</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Session Access Control</span>
          </div>
        </div>

        <div className="space-y-10">
          {/* Option 1: Register */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Operator Name</Label>
                <Input 
                  required
                  placeholder="E.G. JANE DOE"
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-code tracking-widest uppercase focus:border-accent transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Operator ID</Label>
                  <Input 
                    required
                    placeholder="CGV-882"
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-code tracking-widest uppercase focus:border-accent"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Security Level</Label>
                  <Select 
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value as OperatorLevel })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold tracking-widest uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="OPERATOR" className="text-xs font-bold tracking-widest">OPERATOR</SelectItem>
                      <SelectItem value="SUPERVISOR" className="text-xs font-bold tracking-widest">SUPERVISOR</SelectItem>
                      <SelectItem value="ADMIN" className="text-xs font-bold tracking-widest text-accent">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-2xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all font-bold uppercase tracking-[0.2em] text-[10px] group"
            >
              Start Active Session <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5"></span>
            </div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.5em] font-bold text-muted-foreground bg-transparent px-2">
              OR
            </div>
          </div>

          {/* Option 2: Local mode */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={onSkip}
              className="w-full h-12 rounded-xl border border-white/5 hover:bg-white/5 text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all"
            >
              Continue In Local Mode
            </Button>
            
            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-[7px] border-white/5 opacity-40 uppercase tracking-widest px-2">Browser Session</Badge>
              <Badge variant="outline" className="text-[7px] border-white/5 opacity-40 uppercase tracking-widest px-2">Manual Video Source</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
