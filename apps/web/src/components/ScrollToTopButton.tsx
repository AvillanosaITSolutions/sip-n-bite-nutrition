import { useEffect, useState } from "react";

const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Scroll to top"
      data-on-forest
      className="hidden md:inline-flex fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full items-center justify-center shadow-lg transition hover:opacity-90"
      style={{
        backgroundColor: FOREST,
        color: PEACH,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        pointerEvents: visible ? "auto" : "none",
        transitionProperty: "opacity, transform",
        transitionDuration: "280ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 15 12 9 18 15" />
      </svg>
    </button>
  );
}
