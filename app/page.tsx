"use client";

import { DiscoverView } from "./components/discover/discover-view";
import { ControlsFooter } from "./components/layout/controls-footer";
import { SiteHeader } from "./components/layout/site-header";
import { useHome } from "./hooks/use-home";

export default function Home() {
  const home = useHome();
  const {
    appMode,
    focusMode,
    setFocusMode,
    isMobileLayout,
    mobileDiscoverPanel,
    closeMobileDiscoverPanel,
  } = home;

  return (
    <main
      className={[
        "page-shell",
        focusMode ? "focus-mode" : "",
        appMode === "discover" ? "discover-mode" : "",
        isMobileLayout ? "mobile-layout" : "",
        mobileDiscoverPanel ? "mobile-panel-open" : "",
      ].filter(Boolean).join(" ")}
      onPointerDown={() => {
        if (focusMode) setFocusMode(false);
      }}
    >
      {isMobileLayout && mobileDiscoverPanel ? (
        <button
          className="modal-overlay mobile-panel-backdrop"
          type="button"
          aria-label="Close panel"
          onClick={closeMobileDiscoverPanel}
        />
      ) : null}

      <SiteHeader
        apiHealth={home.apiHealth}
        advancedOpen={home.advancedOpen}
        setAdvancedOpen={home.setAdvancedOpen}
        advancedTool={home.advancedTool}
        runAdvancedSearch={home.runAdvancedSearch}
        forgeSlots={home.forgeSlots}
        findForgeWords={home.findForgeWords}
        tools={{
          advancedTool: home.advancedTool,
          setAdvancedTool: home.setAdvancedTool,
          advancedMode: home.advancedMode,
          setAdvancedMode: home.setAdvancedMode,
          advancedQuery: home.advancedQuery,
          setAdvancedQuery: home.setAdvancedQuery,
          advancedStartsWith: home.advancedStartsWith,
          setAdvancedStartsWith: home.setAdvancedStartsWith,
          advancedEndsWith: home.advancedEndsWith,
          setAdvancedEndsWith: home.setAdvancedEndsWith,
          advancedLength: home.advancedLength,
          setAdvancedLength: home.setAdvancedLength,
          advancedTopic: home.advancedTopic,
          setAdvancedTopic: home.setAdvancedTopic,
          advancedResults: home.advancedResults,
          advancedLoading: home.advancedLoading,
          advancedError: home.advancedError,
          setAdvancedResults: home.setAdvancedResults,
          setAdvancedError: home.setAdvancedError,
          forgeSlots: home.forgeSlots,
          setForgeSlots: home.setForgeSlots,
          forgeSyllables: home.forgeSyllables,
          setForgeSyllables: home.setForgeSyllables,
          forgeTotalLetters: home.forgeTotalLetters,
          setForgeTotalLetters: home.setForgeTotalLetters,
          forgeWords: home.forgeWords,
          forgedWord: home.forgedWord,
          forgeReady: home.forgeReady,
          forgeRemixing: home.forgeRemixing,
          forgeCopied: home.forgeCopied,
          setForgeCopied: home.setForgeCopied,
          updateForgeSlot: home.updateForgeSlot,
          findForgeWords: home.findForgeWords,
          lockForgeSeedWord: home.lockForgeSeedWord,
          cycleForgeWord: home.cycleForgeWord,
          commitWord: home.commitWord,
          setMessage: home.setMessage,
          selectAppMode: home.selectAppMode,
        }}
      />

      {appMode === "discover" ? <DiscoverView {...home} /> : null}

      <ControlsFooter {...home} />
    </main>
  );
}
