"use client";

import { useCallback, type MouseEvent } from "react";
import { sounds } from "../../lib/sounds";

export function useControlPop() {
  return useCallback((event: MouseEvent<HTMLButtonElement>, options?: { sound?: boolean }) => {
    const button = event.currentTarget;
    button.classList.remove("is-popping");
    void button.offsetWidth;
    button.classList.add("is-popping");
    if (options?.sound !== false) sounds.click();
  }, []);
}
