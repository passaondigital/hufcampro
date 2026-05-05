import { useState, useEffect, useCallback } from "react";

interface OrientationState {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  isLevel: boolean;
  tiltAngle: number;
  hasPermission: boolean;
  isSupported: boolean;
}

const THROTTLE_INTERVAL = 100;
const LEVEL_THRESHOLD = 5;

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<OrientationState>({
    alpha: null, beta: null, gamma: null,
    isLevel: true, tiltAngle: 0,
    hasPermission: false,
    isSupported: typeof window !== "undefined" && "DeviceOrientationEvent" in window,
  });

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (permission === "granted") {
          setOrientation(prev => ({ ...prev, hasPermission: true }));
          return true;
        }
      } catch { return false; }
    } else {
      setOrientation(prev => ({ ...prev, hasPermission: true }));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!orientation.isSupported) return;
    let lastUpdateTime = 0;
    let pendingUpdate: OrientationState | null = null;
    let rafId: number | null = null;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;
      const verticalTilt = beta !== null ? Math.abs(90 - Math.abs(beta)) : 0;
      const horizontalTilt = gamma !== null ? Math.abs(gamma) : 0;
      const tiltAngle = Math.max(verticalTilt, horizontalTilt);
      const isLevel = tiltAngle <= LEVEL_THRESHOLD;
      const newState: OrientationState = { alpha, beta, gamma, isLevel, tiltAngle, hasPermission: true, isSupported: true };
      const now = Date.now();
      if (now - lastUpdateTime >= THROTTLE_INTERVAL) {
        lastUpdateTime = now;
        setOrientation(newState);
      } else {
        pendingUpdate = newState;
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            if (pendingUpdate) { setOrientation(pendingUpdate); lastUpdateTime = Date.now(); pendingUpdate = null; }
            rafId = null;
          });
        }
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [orientation.isSupported]);

  return { ...orientation, requestPermission };
}
