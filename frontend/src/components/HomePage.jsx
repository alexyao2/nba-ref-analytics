import ShaderBackdrop from "./ShaderBackdrop.jsx";
import VideoConstellation from "./VideoConstellation.jsx";

export default function HomePage({ onNavigate }) {
  return (
    <section id="intro-page" className="site-page active" aria-label="Introductory page">
      <section className="evidence-hero react-evidence-hero" aria-label="WhistleRate evidence board">
        <ShaderBackdrop />
        <div className="evidence-backdrop" aria-hidden="true"></div>
        <div className="evidence-copy">
          <p className="eyebrow">Is the NBA rigged?</p>
          <h1>Reading into Referee performance by the numbers.</h1>
          <p className="hero-lede">
            WhistleRate connects controversial call examples with referee-season metrics so public data can be explored like a film room, not just a spreadsheet.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onNavigate("data")}>Explore the data</button>
            <button className="secondary-action" type="button" onClick={() => onNavigate("future")}>View conclusions</button>
          </div>
          <div className="evidence-stats" aria-label="Project focus areas">
            <article className="liquid-card">
              <span>Dataset</span>
              <strong>2016-26</strong>
              <small>Referee-season rows</small>
            </article>
            <article className="liquid-card">
              <span>Signal</span>
              <strong>Foul diff.</strong>
              <small>Road minus home profile</small>
            </article>
            <article className="liquid-card">
              <span>Next layer</span>
              <strong>Film review</strong>
              <small>Call context and media records</small>
            </article>
          </div>
        </div>
        <VideoConstellation />
      </section>

      <section className="content-band muted-band overview-glass-band">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>About the website:</h2>
          </div>
          <button className="primary-action" type="button" onClick={() => onNavigate("data")}>Go to dashboard</button>
        </div>
        <div className="overview-grid">
          <article>
            <strong>Motivation</strong>
            <p>With the level of dissatisfaction surrounding NBA referee decisions, there&apos;s a growing interest in understanding and quantifying referee accuracy.</p>
          </article>
          <article>
            <strong>Data Collection</strong>
            <p>The data used for this analysis includes foul differentials, experience, and called fouls per game aggregated from nbastuffer.com.</p>
          </article>
          <article>
            <strong>Conclusions</strong>
            <p>Leaves space for your next expansion, such as film review, source libraries, team impact, or editorial research.</p>
          </article>
        </div>
      </section>

      {/* Previous single-video hero preserved conceptually:
        <figure className="hero-media">
          <video width="640" height="360" autoPlay loop muted playsInline>
            <source src="./assets/introvideo.mp4" type="video/mp4" />
          </video>
        </figure>
      */}
    </section>
  );
}
