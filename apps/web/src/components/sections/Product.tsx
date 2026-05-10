const features = [
  {
    num: "01",
    title: "Logins",
    desc: "Username, password, URL, notes, and TOTP — bound to the sites they belong to so autofill just works.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <rect x="6" y="14" width="44" height="30" stroke="currentColor" strokeWidth="1.3" />
        <line x1="6" y1="22" x2="50" y2="22" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="13" cy="18" r="1" fill="currentColor" />
        <circle cx="17" cy="18" r="1" fill="currentColor" />
        <line x1="14" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="1.3" />
        <line x1="14" y1="37" x2="32" y2="37" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Secure notes",
    desc: "API keys, recovery phrases, the back of the hard drive. Plain-text at rest is plain-text for attackers.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <path d="M12 8h24l8 8v32H12z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M36 8v8h8" stroke="currentColor" strokeWidth="1.3" />
        <line x1="18" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="1.3" />
        <line x1="18" y1="32" x2="38" y2="32" stroke="currentColor" strokeWidth="1.3" />
        <line x1="18" y1="38" x2="30" y2="38" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "TOTP secrets",
    desc: "Built-in authenticator. Generated codes live next to the credential they protect.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="1.3" />
        <path d="M28 14v14l10 6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M28 6a22 22 0 0 1 16 6" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Autofill",
    desc: "The extension watches for login forms on domains you know. One click, password filled. Nothing sent unless you consent.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <rect x="8" y="18" width="40" height="20" stroke="currentColor" strokeWidth="1.3" />
        <path d="M28 8v10M24 14l4 4 4-4" stroke="currentColor" strokeWidth="1.3" />
        <line x1="14" y1="28" x2="42" y2="28" stroke="currentColor" strokeWidth="1.3" strokeDasharray="2 3" />
      </svg>
    ),
  },
  {
    num: "05",
    title: "Save & update",
    desc: "New login? We'll offer to save it. Password changed? We'll offer to update. No save-buttons fatigue.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <rect x="10" y="10" width="36" height="36" stroke="currentColor" strokeWidth="1.3" />
        <path d="M20 28l6 6 12-14" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    num: "06",
    title: "Device sessions",
    desc: "See every device that holds a key. Revoke anything suspicious from the web app — it'll lose access on next sync.",
    glyph: (
      <svg className="glyph" viewBox="0 0 56 56" fill="none">
        <rect x="6" y="12" width="28" height="20" stroke="currentColor" strokeWidth="1.3" />
        <rect x="32" y="22" width="18" height="26" stroke="currentColor" strokeWidth="1.3" />
        <line x1="12" y1="36" x2="28" y2="36" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
];

export default function Product() {
  return (
    <section id="product" className="bordered">
      <div className="wrap section-pad">
        <div className="section-head">
          <div className="section-num">§ 01 / Product</div>
          <div>
            <h2 className="section-title">
              Two surfaces. <span className="it">One</span> vault, always encrypted.
            </h2>
            <p className="section-lede">
              The web app is the command center — full browsing, editing, and device management.
              The extension is the fast daily layer that lives next to your address bar.
            </p>
          </div>
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.num} className="feature">
              <div className="num">{f.num}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              {f.glyph}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
