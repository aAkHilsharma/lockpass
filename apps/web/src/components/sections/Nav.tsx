"use client";

export default function Nav() {
  return (
    <div className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="brand">
          <span className="brand-wordmark">
            <span className="w-lock">Lock</span>
            <span className="w-pass">Pass</span>
          </span>
        </a>
        <nav className="nav-links">
          <a href="#product" className="hide-sm">Product</a>
          <a href="#security">Security</a>
          <a href="#how" className="hide-sm">How it works</a>
          <a href="#extension">Extension</a>
          <a href="/signup" className="nav-cta">
            Get LockPass
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </a>
        </nav>
      </div>
    </div>
  );
}
