import { Link } from "react-router-dom";

const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";
const FOREST = "#1E3D2F";

function PeachPill({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:opacity-90 transition"
      style={{ backgroundColor: PEACH }}
    >
      {children}
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
      >
        ↗
      </span>
    </Link>
  );
}

export function About() {
  return (
    <div className="w-full" style={{ backgroundColor: CREAM, color: FOREST }}>
      {/* HERO */}
      <section className="px-6 md:px-10 pt-14 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
            our story
          </p>
          <h1
            className="font-display text-5xl md:text-7xl leading-[0.95] mt-2"
            style={{ color: FOREST }}
          >
            ABOUT SIP 'N BITE
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-stone-600 leading-relaxed">
            Sip 'N Bite Nutrition began as a small hub for friends who wanted real
            wellness without the bland. We blend authentic Herbalife formulas with
            chef-crafted shakes and snacks — honest ingredients, every shake,
            every bite.
          </p>
        </div>
      </section>

      {/* MISSION / VALUES */}
      <section className="px-6 md:px-10 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          {[
            {
              title: "Real ingredients",
              body:
                "No shortcuts, no fillers. Every recipe starts from ingredients you can recognize.",
              bg: MUSTARD,
              icon: "🌿",
            },
            {
              title: "Authentic Herbalife",
              body:
                "We're an official hub — every product is sourced direct, never repacked.",
              bg: FOREST,
              icon: "🥤",
              dark: true,
            },
            {
              title: "Community first",
              body:
                "Wellness is easier together. We coach, share, and celebrate every small win.",
              bg: PEACH_SOFT,
              icon: "🤝",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl p-6 min-h-[220px] flex flex-col justify-between shadow-sm"
              style={{ backgroundColor: v.bg, color: v.dark ? "white" : FOREST }}
            >
              <div className="text-4xl">{v.icon}</div>
              <div>
                <p className="text-xl font-extrabold mt-4">{v.title}</p>
                <p className="text-sm mt-2 opacity-90 leading-relaxed">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STORY BAND */}
      <section className="px-6 md:px-10 py-16" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div
            className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl relative"
            style={{ backgroundColor: "#E9EAD8" }}
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/about-us/owners.jpg`}
              alt="The owners of Sip 'N Bite Nutrition"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow"
              style={{ backgroundColor: FOREST, color: "white" }}
            >
              The Owners
            </div>
          </div>
          <div>
            <h2
              className="font-display text-4xl md:text-6xl leading-[0.95]"
              style={{ color: FOREST }}
            >
              CRAFTED <span className="font-script text-5xl md:text-7xl" style={{ color: PEACH }}>with care</span>
            </h2>
            <p className="mt-5 text-stone-600 leading-relaxed">
              Every shake is hand-blended to order. Every snack is portioned by
              hand. We keep batches small so flavor stays bright and ingredients
              stay fresh — the way good food should be served.
            </p>
            <p className="mt-3 text-stone-600 leading-relaxed">
              Whether you're starting a wellness journey or just want a guilt-free
              treat between meetings, there's a sip and a bite here for you.
            </p>
            <div className="mt-6">
              <PeachPill to="/menu">Explore the Menu</PeachPill>
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              the people behind the blender
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              MEET JUNE &amp; JANET
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: "June",
                role: "Co-founder · Head of Wellness",
                body:
                  "A certified Herbalife member and lifelong fitness enthusiast. June dials in every recipe so it hits your macros without losing flavor — and remembers your usual order before you order it.",
              },
              {
                name: "Janet",
                role: "Co-founder · Hospitality & Operations",
                body:
                  "The warm welcome at the door and the quiet hand behind the scenes. Janet runs the morning prep, keeps the hub stocked, and makes sure every customer leaves feeling like family.",
              },
            ].map((p) => (
              <div
                key={p.name}
                className="rounded-2xl p-6 flex gap-5 shadow-sm"
                style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shrink-0"
                  style={{ backgroundColor: FOREST, color: CREAM }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-xl font-extrabold leading-tight" style={{ color: FOREST }}>
                    {p.name}
                  </p>
                  <p className="text-xs uppercase tracking-widest font-bold mt-0.5" style={{ color: PEACH }}>
                    {p.role}
                  </p>
                  <p className="text-sm text-stone-600 mt-3 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR JOURNEY TIMELINE */}
      <section className="px-6 md:px-10 py-16" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              twelve years in the making
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              OUR JOURNEY
            </h2>
          </div>

          <ol className="relative grid md:grid-cols-4 gap-8">
            {/* connector line */}
            <div
              aria-hidden
              className="hidden md:block absolute left-0 right-0 top-5 h-0.5"
              style={{ backgroundColor: PEACH_SOFT }}
            />
            {[
              {
                year: "2013",
                title: "The spark",
                body:
                  "June discovers Herbalife and starts coaching friends and family on protein goals from her kitchen.",
              },
              {
                year: "2022",
                title: "Hub opens",
                body:
                  "Sip 'N Bite Nutrition opens its doors on Castro Street in Puerto Princesa — one blender, two founders.",
              },
              {
                year: "2024",
                title: "Local favorite",
                body:
                  "Word spreads. Locals, gym-goers, and solo travelers stop in daily. First 5-star Google reviews roll in.",
              },
              {
                year: "2026",
                title: "Fueling Balikatan",
                body:
                  "US and PH service members load up on high-protein meals during Balikatan exercises — proof that strength starts with proper fuel.",
              },
            ].map((m) => (
              <li key={m.year} className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm relative z-10"
                  style={{ backgroundColor: FOREST, color: MUSTARD }}
                >
                  ★
                </div>
                <p className="font-display text-3xl mt-4" style={{ color: FOREST }}>
                  {m.year}
                </p>
                <p className="text-sm font-extrabold mt-1" style={{ color: FOREST }}>
                  {m.title}
                </p>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {m.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              the quick answers
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              FREQUENTLY ASKED
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Are your Herbalife products authentic?",
                a: "Yes. We're an official Herbalife member hub — every canister, tea, and supplement is sourced direct from Herbalife. Never repacked, never imitation.",
              },
              {
                q: "Can I customize my shake?",
                a: "Absolutely. Most shakes can be combined with another flavor at no extra cost, and we can adjust protein boost, oats, or aloe based on your goals.",
              },
              {
                q: "Do you deliver?",
                a: "We accept pickup and local delivery within Puerto Princesa. Place your order through the menu and choose your fulfillment at checkout.",
              },
              {
                q: "Do you offer wellness coaching?",
                a: "Yes — June walks you through your protein goals, meal timing, and which Herbalife formulas fit your routine. Free with any shake, just ask at the counter.",
              },
              {
                q: "What are your hours?",
                a: "Mon–Sat: 7am–8pm. Closed Sundays. Holidays may vary — check our Instagram @sip.n.bitenutrition for updates.",
              },
              {
                q: "Where exactly are you?",
                a: "In front of Breadlane Homebakes, 3rd Castro Street, L Nadayao Rd, Puerto Princesa City. The map and directions are on our home page.",
              },
            ].map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl overflow-hidden"
                style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
              >
                <summary
                  className="cursor-pointer list-none flex items-center justify-between gap-4 p-5 select-none"
                  style={{ color: FOREST }}
                >
                  <span className="font-extrabold text-base md:text-lg">{f.q}</span>
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-transform group-open:rotate-45 shrink-0"
                    style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-stone-600 leading-relaxed">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: "5,000+", label: "Shakes served" },
            { n: "200+", label: "5-star reviews" },
            { n: "30+", label: "Herbalife SKUs" },
            { n: "2022", label: "Hub since" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-6 text-center shadow-sm"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              <p className="text-3xl md:text-4xl font-black" style={{ color: FOREST }}>
                {s.n}
              </p>
              <p className="text-xs uppercase tracking-widest text-stone-500 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-20" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-script text-4xl md:text-5xl mb-2" style={{ color: PEACH }}>
            come say hi
          </p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.9]" style={{ color: FOREST }}>
            VISIT THE HUB
          </h2>
          <p className="mt-6 text-stone-600 max-w-xl mx-auto">
            Drop by for a shake, a snack, or a chat about your wellness goals.
            We're here Mon–Sat 7am–8pm. Closed Sundays.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <PeachPill to="/menu">Order a Shake</PeachPill>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition"
              style={{ backgroundColor: "white", color: FOREST, border: `1px solid ${FOREST}20` }}
            >
              Shop Herbalife ↗
            </Link>
          </div>

          {/* Social / contact strip */}
          <div className="mt-10">
            <p className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-3">
              Or reach out directly
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="https://www.instagram.com/sip.n.bitenutrition"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
              >
                📷 @sip.n.bitenutrition
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100077877788737"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
              >
                💬 Facebook
              </a>
              <a
                href="tel:+639988845795"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
              >
                📞 0998 884 5795
              </a>
              <a
                href="mailto:rosalie_ropero@yahoo.com"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-90"
                style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
              >
                ✉ rosalie_ropero@yahoo.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
