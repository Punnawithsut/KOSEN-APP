"use client";

import { useSyncExternalStore } from "react";

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

function getSnapshot(): boolean { 
  if (typeof window === "undefined") return false;
  const isDisplayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as NavigatorStandalone).standalone === true;
  return isDisplayModeStandalone || iosStandalone;
}

function getServerSnapshot(): boolean | null {
  return null;
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(display-mode: standalone)");
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }

  mql.addListener(callback);
  return () => mql.removeListener(callback);
}

export function useIsStandalone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}