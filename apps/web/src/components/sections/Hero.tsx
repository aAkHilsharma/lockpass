export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>

          <h1 className="display">
            A vault <span className="it">encrypted</span>{" "}
            before it leaves your device.
          </h1>
          <p className="hero-sub">
            LockPass keeps your logins, notes, and TOTP secrets locally encrypted and synced
            across your browser and web app — for the people who still read the fine print.
          </p>
          <div className="hero-cta">
            <a href="/signup" className="btn btn-primary">
              Create your vault
              <svg className="arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </a>
            <a href="#extension" className="btn btn-ghost">
              See the extension
            </a>
          </div>
        </div>

        <aside className="hero-aside">
          <div className="spec-card">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="spec-head">
              <span>// spec</span>
              <span>0001 / A</span>
            </div>

            <div className="spec-row">
              <div className="k">Model</div>
              <div className="v">Zero-knowledge. Keys derived client-side; the server sees ciphertext.</div>
            </div>
            <div className="spec-row">
              <div className="k">Cipher</div>
              <div className="v mono">XChaCha20-Poly1305 · Argon2id</div>
            </div>
            <div className="spec-row">
              <div className="k">Surfaces</div>
              <div className="v">Web app · browser extension. Mobile later, by design.</div>
            </div>
            <div className="spec-row">
              <div className="k">Items</div>
              <div className="v">Logins · secure notes · TOTP</div>
            </div>
            <div className="spec-row">
              <div className="k">Sync</div>
              <div className="v">Encrypted envelopes, device-aware sessions</div>
            </div>
            <div className="spec-row">
              <div className="k">Source</div>
              <div className="v">Client open for inspection</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
