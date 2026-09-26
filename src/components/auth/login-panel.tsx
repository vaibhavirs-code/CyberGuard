
"use client";

import React, { useState } from "react";
import { ChevronRight, Activity, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { OperatorLevel, OperatorSession } from "@/lib/types";
import { signInOperator } from "@/services/auth-service";

interface LoginPanelProps {
  onRegister: (data: Omit<OperatorSession, "mode">) => void;
  onSkip: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onRegister, onSkip }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSigningIn(true);
    try {
      const session = await signInOperator(formData.email.trim(), formData.password);
      onRegister(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSigningIn(false);
    }
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
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Work Email</Label>
                <Input
                  required
                  type="email"
                  placeholder="operator@store.com"
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-code tracking-widest focus:border-accent transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Password</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    type="password"
                    placeholder="ENTER SESSION PASSWORD"
                    className="bg-white/5 border-white/10 h-12 rounded-xl pl-10 text-xs font-code tracking-widest focus:border-accent transition-colors"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

            </div>

            <Button 
              type="submit"
              className="w-full h-14 rounded-2xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all font-bold uppercase tracking-[0.2em] text-[10px] group"
            >
              {isSigningIn ? "Authenticating..." : "Sign In"} <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-[9px] font-bold uppercase tracking-widest text-red-300">{error}</p>
          )}
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
