export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="aura-border rounded-[2rem] border border-white/10 bg-black/40 px-8 py-6 font-code text-sm uppercase tracking-[0.5em] text-accent">
        Booting dashboard
      </div>
    </div>
  );
}
