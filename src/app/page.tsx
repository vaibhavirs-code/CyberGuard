"use client";

import { useEffect, useRef, useState } from "react";
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
  const navigationHistoryRef = useRef<AppView[]>(["intro"]);

  const navigateTo = (nextView: AppView) => {
    navigationHistoryRef.current = [...navigationHistoryRef.current, nextView];
    setView(nextView);
  };

  const goBack = (fallback: AppView) => {
    if (navigationHistoryRef.current.length <= 1) {
      navigationHistoryRef.current = [fallback];
      setView(fallback);
      return;
    }

    const next = navigationHistoryRef.current.slice(0, -1);
    navigationHistoryRef.current = next;
    setView(next[next.length - 1] ?? fallback);
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
