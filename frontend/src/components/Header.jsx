function NavButton({ page, currentPage, onNavigate, children, className = "page-link" }) {
  return (
    <button
      className={`${className}${currentPage === page ? " active" : ""}`}
      type="button"
      onClick={() => onNavigate(page)}
    >
      {children}
    </button>
  );
}

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="site-header glass-header">
      <button className="brand page-link" type="button" aria-label="WhistleRate home" onClick={() => onNavigate("intro")}>
        <span className="brand-mark">WR</span>
        <span>
          <strong>WhistleRate</strong>
          <small>NBA Referee Analysis</small>
        </span>
      </button>
      <nav className="site-nav" aria-label="Primary navigation">
        <NavButton page="intro" currentPage={currentPage} onNavigate={onNavigate}>Intro</NavButton>
        <NavButton page="data" currentPage={currentPage} onNavigate={onNavigate}>Data Dashboard</NavButton>
        <NavButton page="future" currentPage={currentPage} onNavigate={onNavigate}>Conclusions</NavButton>
      </nav>
      <NavButton page="data" currentPage={currentPage} onNavigate={onNavigate} className="nav-cta page-link">
        Open dashboard
      </NavButton>
    </header>
  );
}
