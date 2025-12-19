import { useState, useEffect } from "react";

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Custom hook to detect responsive breakpoints
 * - Mobile: < 768px
 * - Tablet: 768px - 1024px
 * - Desktop: > 1024px
 */
export function useResponsive(): ResponsiveState {
  // Helper function to calculate responsive state from width
  const getResponsiveState = (width: number): ResponsiveState => ({
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  });

  // Initialize with actual window width (or fallback to 1024 for SSR)
  const [state, setState] = useState<ResponsiveState>(() => {
    const initialWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    return getResponsiveState(initialWidth);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState(window.innerWidth));
    };

    // Call once on mount to ensure correct state
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

/**
 * Simple hook to check if viewport is mobile
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

/**
 * Simple hook to check if viewport is desktop
 */
export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive();
  return isDesktop;
}
