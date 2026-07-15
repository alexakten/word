"use client";

import { X } from "lucide-react";
import { ApiHealthStatus } from "../ui/api-health-status";
import { WordmarkLink } from "./wordmark-link";
import type { HomeState } from "../../hooks/use-home";
import { WordToolsPanel } from "./word-tools-panel";

type SiteHeaderProps = Pick<
  HomeState,
  | "apiHealth"
  | "advancedOpen"
  | "setAdvancedOpen"
  | "advancedTool"
  | "runAdvancedSearch"
  | "forgeSlots"
  | "findForgeWords"
> & { tools: React.ComponentProps<typeof WordToolsPanel> };

export function SiteHeader({
  apiHealth,
  advancedOpen,
  setAdvancedOpen,
  advancedTool,
  runAdvancedSearch,
  forgeSlots,
  findForgeWords,
  tools,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-brand">
        <WordmarkLink />
        <ApiHealthStatus health={apiHealth} />
      </div>

      <form
        className="advanced-host"
        onSubmit={(event) => {
          event.preventDefault();
          if (advancedTool === "search") {
            void runAdvancedSearch();
          } else {
            const slotIndex = forgeSlots.findIndex((slot) => !slot.candidates.length);
            if (slotIndex >= 0) void findForgeWords(slotIndex);
          }
        }}
      >
        {advancedOpen ? (
          <div className="advanced-panel" id="advanced-search">
            <div className="advanced-heading">
              <div>
                <p>Word tools</p>
                <span>Find existing words or make a new one</span>
              </div>
              <button type="button" aria-label="Close advanced search" onClick={() => setAdvancedOpen(false)}>
                <X size={14} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <WordToolsPanel {...tools} />
          </div>
        ) : null}
      </form>
    </header>
  );
}
