"use client";

import { useEffect, useState } from "react";
import { ProjectIntroductionScreen } from "@/components/auth/project-introduction-screen";
import { LoginPanel } from "@/components/auth/login-panel";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { IndiaDpiPage } from "@/components/india/india-dpi-page";
import { useDashboardController } from "@/features/dashboard/use-dashboard-controller";
import type { OperatorSession } from "@/lib/types";

type AppView = "intro" | "login" | "dashboard" | "india";

export default function DashboardPage() {
  const controller = useDashboardController();
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<AppView>("intro");
  const [pendingSession, setPendingSession] = useState<OperatorSession | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<AppView[]>(["intro"]);

  const navigateTo = (nextView: AppView) => {
    setNavigationHistory((history) => [...history, nextView]);
    setView(nextView);
  };

  const goBack = (fallback: AppView) => {
    setNavigationHistory((history) => {
      if (history.length <= 1) return [fallback];
      const next = history.slice(0, -1);
      setView(next[next.length - 1] ?? fallback);
      return next;
    });
  };

  useEffect(() => setIsMounted(true), []);

  const goToDashboard = (data: Omit<OperatorSession, "mode">) => {
    const session: OperatorSession = { ...data, mode: "ACTIVE" };
    setPendingSession(session);
    controller.setSession(session);
    controller.initializeCameraWall(1);
    navigateTo("dashboard");
  };

  if (!isMounted) return null;

  if (view === "intro") {
    return <ProjectIntroductionScreen onContinue={() => navigateTo("login")} />;
  }

  if (view === "login") {
    return <LoginPanel onBack={() => goBack("intro")} onRegister={goToDashboard} />;
  }

  if (view === "india") {
    return <IndiaDpiPage onBack={() => goBack("dashboard")} onOpenDashboard={() => navigateTo("dashboard")} />;
  }

  return (
    <DashboardScreen
      controller={controller}
      deploymentMode="single"
      operatorLevel={pendingSession?.level ?? "OPERATOR"}
      onOpenIndiaPage={() => navigateTo("india")}
    />
  );
}
