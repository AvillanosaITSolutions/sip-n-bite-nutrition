import { Link } from "react-router-dom";
import { useToast } from "../store/toast";

const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";
const CREAM = "#FBF6EA";

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto rounded-2xl shadow-xl flex items-center gap-3 p-3 pr-4 w-[320px] max-w-[92vw]"
          style={{
            backgroundColor: FOREST,
            color: CREAM,
            animation: "toastIn 280ms cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(244,167,126,0.18)" }}
          >
            {t.imageUrl ? (
              <img src={t.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🛒</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold leading-tight truncate">{t.message}</p>
            {t.description && (
              <p className="text-[11px] opacity-80 mt-0.5 truncate">{t.description}</p>
            )}
            <Link
              to="/cart"
              className="text-[11px] font-bold uppercase tracking-widest inline-block mt-1"
              style={{ color: PEACH }}
              onClick={() => dismiss(t.id)}
            >
              View cart ↗
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-stone-300 hover:text-white text-sm w-6 h-6 inline-flex items-center justify-center"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
