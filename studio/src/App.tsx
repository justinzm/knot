export function App() {
  return (
    <main className="app-frame">
      <aside className="sidebar">
        <h1>Knot Studio</h1>
        <nav>
          <button className="nav-item active">Overview</button>
          <button className="nav-item">Workflow Builder</button>
          <button className="nav-item">Run Console</button>
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <span>No project selected</span>
          <span className="status-pill">idle</span>
        </header>
        <div className="empty-state">
          <h2>Open a Knot project to begin</h2>
          <p>Select a local project folder that contains or should contain a Knot runtime.</p>
        </div>
      </section>
    </main>
  );
}
