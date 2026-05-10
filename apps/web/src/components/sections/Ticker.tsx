const items = [
  "Encrypted before sync",
  "Argon2id key derivation",
  "XChaCha20-Poly1305",
  "Client-side decryption",
  "Recovery key, not a backdoor",
  "Zero server-side plaintext",
  "Device-aware sessions",
];

export default function Ticker() {
  return (
    <div className="ticker">
      <div className="ticker-track">
        {[...items, ...items].map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
