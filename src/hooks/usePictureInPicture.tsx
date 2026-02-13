import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export function usePictureInPicture() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const isSupported = typeof window !== "undefined" && !!window.documentPictureInPicture;
  const isOpen = !!pipWindow;
  const closingRef = useRef(false);

  const open = useCallback(async () => {
    if (!window.documentPictureInPicture) return;
    try {
      const win = await window.documentPictureInPicture.requestWindow({
        width: 300,
        height: 180,
      });

      // Clone stylesheets
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        win.document.head.appendChild(node.cloneNode(true));
      });

      // Copy dark class
      if (document.documentElement.classList.contains("dark")) {
        win.document.documentElement.classList.add("dark");
      }

      const container = win.document.createElement("div");
      win.document.body.appendChild(container);
      setPipWindow(win);
      setPipContainer(container);

      win.addEventListener("pagehide", () => {
        if (!closingRef.current) {
          closingRef.current = true;
          setPipWindow(null);
          setPipContainer(null);
          closingRef.current = false;
        }
      });
    } catch {
      // User cancelled or API error
    }
  }, []);

  const close = useCallback(() => {
    if (pipWindow && !closingRef.current) {
      closingRef.current = true;
      pipWindow.close();
      setPipWindow(null);
      setPipContainer(null);
      closingRef.current = false;
    }
  }, [pipWindow]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  useEffect(() => {
    return () => {
      if (pipWindow) pipWindow.close();
    };
  }, [pipWindow]);

  const Portal = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (!pipContainer) return null;
      return createPortal(children, pipContainer);
    },
    [pipContainer]
  );

  return { isSupported, isOpen, toggle, Portal };
}
