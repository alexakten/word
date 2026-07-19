/** Viewport width at/below which Discover uses the mobile overlay layout. */
export const MOBILE_LAYOUT_MAX_WIDTH = 1240;

export const LAYOUT_ATTR = "data-layout";

/** Inline bootstrap so refresh applies mobile/desktop layout before paint. */
export const layoutBootstrapScript = `(function(){try{var m=window.matchMedia("(max-width: ${MOBILE_LAYOUT_MAX_WIDTH}px)");var s=function(){document.documentElement.setAttribute("${LAYOUT_ATTR}",m.matches?"mobile":"desktop");};s();typeof m.addEventListener==="function"?m.addEventListener("change",s):m.addListener(s);}catch(e){}})();`;
