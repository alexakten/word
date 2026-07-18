"use client";

import { useCallback, type MouseEvent } from "react";

export function useControlPop() {
  return useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    button.classList.remove("is-popping");
    void button.offsetWidth;
    button.classList.add("is-popping");
  }, []);
}
