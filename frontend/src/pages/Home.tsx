export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <span className="hero-eyebrow">ZAMA FHEVM · CONFIDENTIAL DISTRIBUTION</span>
        <h1 className="hero-title">
          Distribute tokens.
          <br />
          <span className="hero-title-accent">Reveal nothing.</span>
        </h1>
        <p className="hero-sub">
          Helixra encrypts every allocation in your browser and disperses it
          confidentially on-chain. Amounts never touch the chain in plaintext —
          and each recipient can decrypt only their own.
        </p>
        <div className="hero-actions">
          <a className="btn-primary hero-cta" href="/app">Launch App →</a>
          <a className="btn-ghost hero-cta-ghost" href="/recipient">
            I received an allocation
          </a>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-num">01</span>
          <h3 className="feature-title">Encrypted amounts</h3>
          <p className="feature-text">
            Allocations are FHE-encrypted in the browser and sent via TokenOps
            confidential disperse. The plaintext never leaves your machine.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-num">02</span>
          <h3 className="feature-title">Private on-chain analytics</h3>
          <p className="feature-text">
            HelixraAnalytics computes an encrypted running total and average
            allocation with FHE.add and FHE.div — insight without exposure.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-num">03</span>
          <h3 className="feature-title">Owner-only decryption</h3>
          <p className="feature-text">
            Recipients connect a wallet and use EIP-712 user-decryption to
            reveal their allocation — and only theirs.
          </p>
        </div>
      </section>

      <section className="steps">
        <h2 className="section-head">How it works</h2>
        <ol className="steps-list">
          <li className="step">
            <span className="step-n">1</span>
            <div>
              <h4>Upload recipients</h4>
              <p>Drop a CSV of addresses, amounts, and labels. Labels stay client-side, never on-chain.</p>
            </div>
          </li>
          <li className="step">
            <span className="step-n">2</span>
            <div>
              <h4>Preflight &amp; disperse</h4>
              <p>Readiness checks run, amounts are encrypted, and tokens are dispersed confidentially in one flow.</p>
            </div>
          </li>
          <li className="step">
            <span className="step-n">3</span>
            <div>
              <h4>Claim &amp; verify</h4>
              <p>Recipients open their link, decrypt their allocation, and get a signed receipt.</p>
            </div>
          </li>
        </ol>
      </section>

      <footer className="home-footer">
        <span>Built for the Zama Developer Program · Season 3</span>
        <a href="https://github.com/Shanks239/Helixra" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </footer>
    </div>
  )
}
