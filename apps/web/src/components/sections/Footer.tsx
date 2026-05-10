export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand" style={{ marginBottom: 18 }}>
              <span className="brand-wordmark">
                <span className="w-lock">Lock</span>
                <span className="w-pass">Pass</span>
              </span>
            </div>
            <p
              style={{
                maxWidth: 360,
                margin: 0,
                color: "var(--ink-3)",
                fontSize: 13.5,
              }}
            >
              A password manager for web and browser. Logins, notes, and TOTP; mobile follows the
              same architecture.
            </p>
          </div>
          <div>
            <h6>Product</h6>
            <ul>
              <li><a href="#product">Features</a></li>
              <li><a href="#extension">Extension</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h6>Security</h6>
            <ul>
              <li><a href="#security">Architecture</a></li>
              <li><a href="#">Threat model</a></li>
              <li><a href="#">Disclosure</a></li>
              <li><a href="#">Source</a></li>
            </ul>
          </div>
          <div>
            <h6>Company</h6>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Writing</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-meta">
          <span>© 2026 Lockpass — Designed for people who read fine print.</span>
          <span>build a17f3c</span>
        </div>
      </div>
    </footer>
  );
}
