
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronRight, Activity, LockKeyhole, ShieldCheck, EyeOff, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OperatorSession } from "@/lib/types";
import { registerOperator, signInOperator } from "@/services/auth-service";

interface LoginPanelProps {
  onRegister: (data: Omit<OperatorSession, "mode">) => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onRegister }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registration, setRegistration] = useState({
    name: "",
    operatorId: "",
    store: "",
  });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsRegistering(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const message = await registerOperator(
        email,
        formData.password,
        registration.name.trim(),
        registration.operatorId.trim(),
        registration.store.trim(),
      );
      setError(message);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSigningIn(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const session = await signInOperator(email, formData.password);
      onRegister(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex min-h-full items-start justify-center overflow-x-hidden overflow-y-auto overscroll-contain bg-black/80 px-4 py-6 backdrop-blur-xl sm:py-8">
      <div className="relative w-full max-w-[500px] shrink-0 glass rounded-[2.5rem] p-10 border-white/5 aura-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
        <div className="absolute inset-0 shimmer opacity-5 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-xl bg-accent/20 border border-accent/40">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground font-headline">Secure Operator Login</h2>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Privacy-first retail monitoring</span>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-center">
            <EyeOff className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
            <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-200">Faces masked</p>
          </div>
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
            <Database className="mx-auto mb-1 h-4 w-4 text-accent" />
            <p className="text-[8px] font-bold uppercase tracking-widest text-cyan-100">DPI events</p>
          </div>
          <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-3 text-center">
            <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-violet-200" />
            <p className="text-[8px] font-bold uppercase tracking-widest text-violet-100">Human review</p>
          </div>
        </div>

        <div className="space-y-10">
          {isCreating ? (
            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="space-y-4">
                <Input required placeholder="Operator Name" value={registration.name} onChange={(e) => setRegistration({ ...registration, name: e.target.value })} />
                <Input required placeholder="Operator ID" value={registration.operatorId} onChange={(e) => setRegistration({ ...registration, operatorId: e.target.value })} />
                <Input required placeholder="Store / Branch" value={registration.store} onChange={(e) => setRegistration({ ...registration, store: e.target.value })} />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl bg-accent/10 border border-accent/30 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
                {isRegistering ? "Creating Account..." : "Create Operator Account"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-[10px] uppercase tracking-widest" onClick={() => setIsCreating(false)}>
                Back to Sign In
              </Button>
            </form>
          ) : (
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
          <Button type="button" variant="outline" className="w-full h-12 rounded-2xl text-[10px] uppercase tracking-widest" onClick={() => setIsCreating(true)}>
            Create Operator Account
          </Button>
          )}
        </div>
      </div>
    </div>
  );
};
