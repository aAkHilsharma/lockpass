"use client";

import { useState, useCallback } from "react";

type DemoState = "locked" | "matches" | "autofill" | "search" | "save";

const steps: { state: DemoState; label: string; description: string }[] = [
  {
    state: "locked",
    label: "01 Locked",
    description:
      "Extension is locked. The user authenticates their vault, not their account — two separate things.",
  },
  {
    state: "matches",
    label: "02 Matching logins",
    description:
      "Unlocked and on a known domain. LockPass surfaces matching credentials automatically — no search needed.",
  },
  {
    state: "autofill",
    label: "03 Autofill",
    description:
      "One click to fill. The credentials are decrypted in memory and written to the form. Nothing leaves the browser tab.",
  },
  {
    state: "search",
    label: "04 Quick search",
    description:
      "Any time you need a credential that isn't matched to the current domain, search pulls from your full vault.",
  },
  {
    state: "save",
    label: "05 Save new login",
    description:
      "New form detected. LockPass offers to save. You review, confirm — it's encrypted and in your vault before you switch tabs.",
  },
];

function LockedPopover() {
  return (
    <>
      <div className="ext-head">
        <div className="brand-mini">
          <span className="bm" />
          <span>Lockpass</span>
        </div>
        <span>// vault locked</span>
      </div>
      <div className="ext-body ext-locked">
        <div className="hint">// vault access</div>
        <h6>Unlock your vault.</h6>
        <div className="lock-glyph" />
        <div className="ext-pin">
          <input type="password" maxLength={1} placeholder="·" readOnly />
          <input type="password" maxLength={1} placeholder="·" readOnly />
          <input type="password" maxLength={1} placeholder="·" readOnly />
          <input type="password" maxLength={1} placeholder="·" readOnly />
        </div>
        <button className="ext-btn">Unlock</button>
        <button className="ext-btn ghost" style={{ marginTop: 8 }}>
          Use master password
        </button>
      </div>
    </>
  );
}

function MatchesPopover() {
  return (
    <>
      <div className="ext-head">
        <div className="brand-mini">
          <span className="bm" />
          <span>Lockpass</span>
        </div>
        <span>// matches</span>
      </div>
      <div className="ext-search">
        <span className="k">›_</span>
        <input type="text" placeholder="search vault..." readOnly />
      </div>
      <div className="match-context">
        <span>figmateal.studio</span>
        <span>·</span>
        <span>2 matches</span>
      </div>
      <div className="match-list">
        <div className="match focused">
          <div className="av">F</div>
          <div>
            <div className="mt">Figmateal</div>
            <div className="ms">nora@atlaslabs.co</div>
          </div>
          <span className="act">fill ↵</span>
        </div>
        <div className="match">
          <div className="av">F</div>
          <div>
            <div className="mt">Figmateal (work)</div>
            <div className="ms">nora.chen@figmateal.co</div>
          </div>
          <span className="act">fill ↵</span>
        </div>
      </div>
    </>
  );
}

function AutofillPopover() {
  return (
    <>
      <div className="ext-head">
        <div className="brand-mini">
          <span className="bm" />
          <span>Lockpass</span>
        </div>
        <span>// filled</span>
      </div>
      <div className="ext-flash">
        <div className="badge">✓ filled</div>
        <h6>Credentials filled.</h6>
        <p>nora@atlaslabs.co · figmateal.studio</p>
      </div>
      <div className="ext-body" style={{ paddingTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--ink-3)",
            marginBottom: 10,
          }}
        >
          <span>1 vault</span>
          <span>Lockpass</span>
        </div>
        <button className="ext-btn ghost">View item</button>
      </div>
    </>
  );
}

function SearchPopover() {
  return (
    <>
      <div className="ext-head">
        <div className="brand-mini">
          <span className="bm" />
          <span>Lockpass</span>
        </div>
        <span>// search</span>
      </div>
      <div className="ext-search">
        <span className="k">›_</span>
        <input type="text" defaultValue="github" readOnly />
      </div>
      <div className="match-list">
        {[
          { av: "G", title: "GitHub", user: "nora@atlaslabs.co" },
          { av: "G", title: "GitHub (work)", user: "nora@figmateal.co" },
          { av: "G", title: "GitLab", user: "nora.chen" },
        ].map((m) => (
          <div key={m.title} className="match">
            <div className="av">{m.av}</div>
            <div>
              <div className="mt">{m.title}</div>
              <div className="ms">{m.user}</div>
            </div>
            <span className="act">fill ↵</span>
          </div>
        ))}
      </div>
    </>
  );
}

function SavePopover() {
  return (
    <>
      <div className="ext-head">
        <div className="brand-mini">
          <span className="bm" />
          <span>Lockpass</span>
        </div>
        <span>// new login</span>
      </div>
      <div className="ext-body save-body">
        <div className="q">// DETECTED ON PAGE</div>
        <h6>Save this login to your vault?</h6>
        <div className="save-field">
          <span className="k">site</span>
          <span className="v">figmateal.studio</span>
        </div>
        <div className="save-field">
          <span className="k">username</span>
          <span className="v">nora@atlaslabs.co</span>
        </div>
        <div className="save-field">
          <span className="k">password</span>
          <span className="v">••••••••••••</span>
        </div>
        <div className="save-actions">
          <button className="ext-btn" style={{ flex: 1 }}>
            Save login
          </button>
          <button className="ext-btn ghost" style={{ flex: 1 }}>
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
}

export default function ExtensionDemo() {
  const [activeState, setActiveState] = useState<DemoState>("locked");

  const activeStep = steps.find((s) => s.state === activeState)!;

  const renderPopover = useCallback(() => {
    switch (activeState) {
      case "locked":
        return <LockedPopover />;
      case "matches":
        return <MatchesPopover />;
      case "autofill":
        return <AutofillPopover />;
      case "search":
        return <SearchPopover />;
      case "save":
        return <SavePopover />;
    }
  }, [activeState]);

  const fieldFilled = activeState === "autofill";

  return (
    <section id="extension" className="bordered">
      <div className="wrap section-pad">
        <div className="section-head">
          <div className="section-num">§ 04 / Extension</div>
          <div>
            <h2 className="section-title">
              Everyday access, <span className="it">in context.</span>
            </h2>
            <p className="section-lede">
              The extension is the daily layer. It watches for login forms on sites you know,
              unlocks with a PIN or your master password, and fills credentials without ever
              leaving the page.
            </p>
          </div>
        </div>

        <div className="demo-shell">
          <div className="demo-copy">
            <h4>Walk through the extension →</h4>
            <p>
              Click through each state. The popover behaves the way it would on a real page —
              nothing is staged screenshots.
            </p>

            <div className="demo-steps">
              {steps.map((step) => (
                <button
                  key={step.state}
                  className={`demo-step${activeState === step.state ? " active" : ""}`}
                  onClick={() => setActiveState(step.state)}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: 40,
                borderTop: "1px solid var(--rule-soft)",
                paddingTop: 24,
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                // Current state
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  color: "var(--ink-2)",
                  minHeight: 68,
                  maxWidth: 360,
                }}
              >
                {activeStep.description}
              </div>
            </div>
          </div>

          <div className="browser">
            <div className="browser-bar">
              <div className="dots">
                <span />
                <span />
                <span />
              </div>
              <div className="url">
                <span className="lock" />
                <span>app.figmateal.studio/login</span>
              </div>
              <div className="puzzle active">
                <span className="p" />
              </div>
            </div>

            <div className="browser-body">
              <div className="browser-site">
                <div className="form-card">
                  <h5>Sign in to Figmateal</h5>
                  <div className="meta">figmateal.studio</div>
                  <div className={`field${fieldFilled ? " filled" : ""}`}>
                    <label>Email</label>
                    <input
                      type="text"
                      value={fieldFilled ? "nora@atlaslabs.co" : ""}
                      readOnly
                      placeholder=""
                    />
                  </div>
                  <div className={`field${fieldFilled ? " filled" : ""}`}>
                    <label>Password</label>
                    <input
                      type={fieldFilled ? "text" : "password"}
                      value={fieldFilled ? "••••••••••••" : ""}
                      readOnly
                      placeholder="•••••••••••"
                    />
                  </div>
                  <button
                    className="ext-btn"
                    style={{ marginTop: 10, width: "100%", padding: "11px 0" }}
                  >
                    Continue
                  </button>
                </div>
                <div className="side">
                  <div>[ marketing imagery{"\n"}placeholder ]</div>
                </div>
              </div>

              <div className="ext-pop">{renderPopover()}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
