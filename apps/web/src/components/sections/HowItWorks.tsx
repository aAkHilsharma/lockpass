export default function HowItWorks() {
  return (
    <section id="how" className="bordered">
      <div className="wrap section-pad">
        <div className="section-head">
          <div className="section-num">§ 02 / How it works</div>
          <div>
            <h2 className="section-title">
              Account access and <span className="it">vault unlock</span> are different things.
            </h2>
            <p className="section-lede">
              Most people conflate them. Lockpass keeps them separate on purpose — so the server
              can authenticate you without ever being able to read your data.
            </p>
          </div>
        </div>

        <div className="split">
          <div>
            <span className="tag">// server</span>
            <h4>Authenticates the user.</h4>
            <p>
              Email, session, device identity. That's it. The server knows who is asking — not
              what they're asking for.
            </p>
            <ul>
              <li>
                <span className="i">A1</span>
                <div>Email and session tokens — stored server-side.</div>
              </li>
              <li>
                <span className="i">A2</span>
                <div>Encrypted vault envelopes — opaque to the server.</div>
              </li>
              <li>
                <span className="i">A3</span>
                <div>Device registry — you control the list.</div>
              </li>
            </ul>
          </div>
          <div>
            <span className="tag">// client</span>
            <h4>Decrypts the vault.</h4>
            <p>
              Your master password never leaves your device. We derive a key from it locally,
              decrypt the envelope, and work with real data in memory only.
            </p>
            <ul>
              <li>
                <span className="i">B1</span>
                <div>Master password → Argon2id → vault key.</div>
              </li>
              <li>
                <span className="i">B2</span>
                <div>Items decrypted locally on access.</div>
              </li>
              <li>
                <span className="i">B3</span>
                <div>Re-encrypted before any write or sync.</div>
              </li>
            </ul>
          </div>
        </div>

        <div className="seq" style={{ marginTop: 48 }}>
          <div className="seq-step">
            <div className="n">Step 01</div>
            <h5>Sign in</h5>
            <p>Authenticate to your account with email. The server verifies your session — nothing more.</p>
            <div className="illus">
              <svg width="100%" height="34" viewBox="0 0 200 34" fill="none" preserveAspectRatio="none">
                <circle cx="20" cy="17" r="5" stroke="currentColor" strokeWidth="1.2" />
                <line x1="25" y1="17" x2="180" y2="17" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
                <rect x="170" y="11" width="20" height="12" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
          <div className="seq-step">
            <div className="n">Step 02</div>
            <h5>Unlock vault</h5>
            <p>Your master password derives the key, locally. Nothing about it travels to us.</p>
            <div className="illus">
              <svg width="100%" height="34" viewBox="0 0 200 34" fill="none" preserveAspectRatio="none">
                <rect x="10" y="8" width="30" height="18" stroke="currentColor" strokeWidth="1.2" />
                <line x1="40" y1="17" x2="160" y2="17" stroke="currentColor" strokeWidth="1.2" />
                <path d="M160 17l-5-4M160 17l-5 4" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="170" cy="17" r="8" stroke="currentColor" strokeWidth="1.2" />
                <path d="M168 14v6M172 14v6" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
          <div className="seq-step">
            <div className="n">Step 03</div>
            <h5>Access items</h5>
            <p>Browse logins, notes, TOTP codes. Decryption happens in your browser's memory.</p>
            <div className="illus">
              <svg width="100%" height="34" viewBox="0 0 200 34" fill="none" preserveAspectRatio="none">
                <rect x="10" y="4" width="44" height="8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="10" y="14" width="60" height="8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="10" y="24" width="38" height="6" stroke="currentColor" strokeWidth="1.2" />
                <line x1="100" y1="17" x2="190" y2="17" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>
          <div className="seq-step">
            <div className="n">Step 04</div>
            <h5>Sync changes</h5>
            <p>Edits are re-encrypted client-side, then synced as sealed envelopes to all your devices.</p>
            <div className="illus">
              <svg width="100%" height="34" viewBox="0 0 200 34" fill="none" preserveAspectRatio="none">
                <rect x="10" y="10" width="18" height="14" stroke="currentColor" strokeWidth="1.2" />
                <path d="M28 17h40l8-4v8l-8-4" stroke="currentColor" strokeWidth="1.2" />
                <rect x="76" y="10" width="18" height="14" stroke="currentColor" strokeWidth="1.2" />
                <path d="M94 17h40l8-4v8l-8-4" stroke="currentColor" strokeWidth="1.2" />
                <rect x="142" y="10" width="18" height="14" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
