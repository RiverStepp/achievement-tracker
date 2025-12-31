export const HomePage = () => {
  return (
    <div className="grid gap-4
      grid-cols-1
      md:grid-cols-2
      lg:grid-cols-[1fr_320px]">
      
      {/* Main feed panel */}
      <section className="bg-app-panel p-4 rounded-lg">
        feed content
      </section>

      {/* Right sidebar panels */}
      <aside className="grid gap-4">
        <div className="bg-app-panel p-4 rounded-lg">right panel 1</div>
        <div className="bg-app-panel p-4 rounded-lg">right panel 2</div>
      </aside>

    </div>
  );
};