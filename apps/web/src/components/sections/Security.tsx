const cannotSee = [
  { k: "Passwords", v: "Stored as ciphertext. We cannot read them." },
  { k: "TOTP secrets", v: "Encrypted in the same envelope as the item." },
  { k: "Notes", v: "Contents are sealed client-side before upload." },
  { k: "Master key", v: "Never transmitted. Derived on your device, held in memory." },
  { k: "URL history", v: "We don't log where you autofilled." },
];

export default function Security() {
  return (
    <section id="security" className="bordered">
      <div className="wrap section-pad">
        <div className="section-head">
          <div className="section-num">§ 03 / Security</div>
          <div>
            <h2 className="section-title">
              The server sees <span className="it">ciphertext</span>. Nothing more.
            </h2>
            <p className="section-lede">
              Zero-knowledge isn't a marketing word here; it's the constraint we designed against.
              If our infrastructure were compromised tomorrow, your vault would remain sealed.
            </p>
          </div>
        </div>

        <div className="arch">
          <div className="arch-copy">
            <h4>What we can't see.</h4>
            <p>A short, honest list. We'd rather be limited and trusted than powerful and not.</p>
            <div className="arch-list">
              {cannotSee.map((row) => (
                <div key={row.k} className="row">
                  <span className="check" />
                  <span className="k">{row.k}</span>
                  <span>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="arch-diagram">
            <svg viewBox="0 0 560 420" width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" fill="none" />
                </pattern>
              </defs>
              <rect width="560" height="420" fill="url(#grid)" />

              {/* client zone */}
              <rect x="24" y="30" width="240" height="360" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="36" y="50" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="currentColor" letterSpacing="1.2">CLIENT // YOUR DEVICE</text>

              {/* master pwd */}
              <rect x="48" y="72" width="192" height="40" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="58" y="90" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor">Master password</text>
              <text x="58" y="104" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">input · memory only</text>

              <line x1="144" y1="112" x2="144" y2="140" stroke="currentColor" strokeWidth="1.2" />
              <path d="M140 136l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />

              {/* argon2id */}
              <rect x="48" y="144" width="192" height="40" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="58" y="162" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor">Argon2id</text>
              <text x="58" y="176" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">key derivation</text>

              <line x1="144" y1="184" x2="144" y2="212" stroke="currentColor" strokeWidth="1.2" />
              <path d="M140 208l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />

              {/* vault key */}
              <rect x="48" y="216" width="192" height="40" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.04" />
              <text x="58" y="234" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor" fontWeight="500">Vault key</text>
              <text x="58" y="248" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">xchacha20-poly1305</text>

              <line x1="144" y1="256" x2="144" y2="284" stroke="currentColor" strokeWidth="1.2" />
              <path d="M140 280l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />

              {/* items */}
              <rect x="48" y="288" width="192" height="76" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="58" y="306" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor">Items · in-memory</text>
              <line x1="58" y1="316" x2="230" y2="316" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <text x="58" y="330" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">login.title, login.username,</text>
              <text x="58" y="342" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">login.password, totp.secret</text>
              <text x="58" y="356" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.4">// plaintext only here</text>

              {/* server zone */}
              <rect x="296" y="30" width="240" height="360" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" fill="none" />
              <text x="308" y="50" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="currentColor" letterSpacing="1.2">SERVER // LOCKPASS</text>

              {/* session */}
              <rect x="320" y="72" width="192" height="40" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="330" y="90" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor">Session tokens</text>
              <text x="330" y="104" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">auth · device identity</text>

              {/* envelope */}
              <rect x="320" y="144" width="192" height="112" stroke="currentColor" strokeWidth="1.4" fill="currentColor" fillOpacity="0.04" />
              <text x="330" y="162" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor" fontWeight="500">Encrypted envelope</text>
              <line x1="330" y1="172" x2="502" y2="172" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <text x="330" y="188" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.55">f3b1 8a0c 44d1 7e9f 2c40</text>
              <text x="330" y="202" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.55">1b7e c3af 8d21 6f09 e18a</text>
              <text x="330" y="216" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.55">d4c0 72fe a36b 5b82 09f4</text>
              <text x="330" y="230" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.55">6820 1e74 ac32 51b8 4ff0</text>
              <text x="330" y="246" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.4">// opaque ciphertext</text>

              {/* devices */}
              <rect x="320" y="288" width="192" height="76" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="330" y="306" fontFamily="Inter Tight, sans-serif" fontSize="12" fill="currentColor">Device registry</text>
              <line x1="330" y1="316" x2="502" y2="316" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
              <text x="330" y="330" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="currentColor" opacity="0.7">web · ext · revocable</text>

              {/* arrows between */}
              <line x1="240" y1="236" x2="296" y2="200" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
              <path d="M294 196l4 4-6 0" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <text x="246" y="220" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="currentColor" opacity="0.7">encrypt →</text>

              <line x1="296" y1="230" x2="240" y2="330" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
              <text x="248" y="280" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="currentColor" opacity="0.7">← decrypt</text>

              {/* plaintext boundary */}
              <line x1="280" y1="20" x2="280" y2="400" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 4" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
