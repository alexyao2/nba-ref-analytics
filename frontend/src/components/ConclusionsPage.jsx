import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../services/api.js";
import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";

function quadrantFor(profile) {
  if (profile.x >= 0 && profile.y >= 0) return "home";
  if (profile.x < 0 && profile.y < 0) return "road";
  if (profile.x < 0 && profile.y >= 0) return "mixed-home";
  return "mixed-road";
}

function quadrantLabel(value) {
  return {
    home: "Home-favorable profile",
    road: "Road-favorable profile",
    "mixed-home": "Home index, road-favorable whistle",
    "mixed-road": "Home whistle, road-favorable index"
  }[value];
}

function ProfileCard({ profile }) {
  if (!profile) {
    return (
      <div className="selected-profile glass-card" aria-live="polite">
        <span>Hover profile</span>
        <strong>Move over a dot</strong>
        <p>Referee profile details will appear here.</p>
      </div>
    );
  }

  const quadrant = quadrantFor(profile);
  return (
    <div className="selected-profile glass-card" aria-live="polite">
      <span>Hover profile</span>
      <strong>{profile.referee}</strong>
      <p>{profile.season} {splitLabel(profile.split)} · {profile.role || "Role unavailable"} · {formatNumber(profile.games_officiated, 0)} games</p>
      <dl>
        <div><dt>Quadrant</dt><dd>{quadrantLabel(quadrant)}</dd></div>
        <div><dt>Foul diff.</dt><dd>{formatNumber(profile.foul_differential_road_minus_home, 2)}</dd></div>
        <div><dt>Adjusted index</dt><dd>{formatNumber(profile.confidence_adjusted_index, 2)}</dd></div>
        <div><dt>Home win rate</dt><dd>{formatPct(profile.home_team_win_pct)}</dd></div>
        <div><dt>Confidence</dt><dd>{formatPct(profile.confidence)}</dd></div>
      </dl>
    </div>
  );
}

function ScatterPlot({ profiles, selectedProfile, onSelectProfile }) {
  const width = 960;
  const height = 560;
  const margin = { top: 48, right: 34, bottom: 66, left: 74 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const centerX = margin.left + plotWidth / 2;
  const centerY = margin.top + plotHeight / 2;
  const maxX = Math.max(1, ...profiles.map((profile) => Math.abs(profile.x)));
  const maxY = Math.max(1, ...profiles.map((profile) => Math.abs(profile.y)));
  const maxGames = Math.max(1, ...profiles.map((profile) => profile.games_officiated));
  const xFor = (value) => centerX + (value / maxX) * (plotWidth / 2);
  const yFor = (value) => centerY - (value / maxY) * (plotHeight / 2);

  return (
    <div className="scatter-svg-wrap" aria-label="Interactive four quadrant referee scatter plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="conclusionScatterTitle conclusionScatterDesc">
        <title id="conclusionScatterTitle">Interactive referee quadrant map</title>
        <desc id="conclusionScatterDesc">Referee profiles plotted by foul differential and confidence-adjusted home bias index.</desc>
        <rect x="0" y="0" width={width} height={height} className="scatter-bg" />
        <rect x={centerX} y={margin.top} width={plotWidth / 2} height={plotHeight / 2} className="quadrant-zone home-zone" />
        <rect x={margin.left} y={centerY} width={plotWidth / 2} height={plotHeight / 2} className="quadrant-zone road-zone" />

        {[-2, -1, 0, 1, 2].map((index) => {
          const x = centerX + (index / 2) * (plotWidth / 2);
          const y = centerY + (index / 2) * (plotHeight / 2);
          return (
            <g key={index}>
              <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotHeight} className="scatter-grid" />
              <line x1={margin.left} y1={y} x2={margin.left + plotWidth} y2={y} className="scatter-grid" />
            </g>
          );
        })}

        <line x1={margin.left} y1={centerY} x2={margin.left + plotWidth} y2={centerY} className="scatter-axis" />
        <line x1={centerX} y1={margin.top} x2={centerX} y2={margin.top + plotHeight} className="scatter-axis" />
        <text x={centerX + 16} y={margin.top + 24} className="scatter-label label-home">Home-favorable metric profile</text>
        <text x={margin.left + 16} y={margin.top + plotHeight - 18} className="scatter-label label-road">Road-favorable metric profile</text>
        <text x={centerX - 116} y={height - 24} className="scatter-axis-label">Foul differential: road minus home</text>
        <text x={-centerY - 156} y="24" transform="rotate(-90)" className="scatter-axis-label">Confidence-adjusted home bias index</text>

        {profiles.length ? profiles.map((profile, index) => {
          const quadrant = quadrantFor(profile);
          const radius = 5 + Math.sqrt(profile.games_officiated / maxGames) * 9;
          const selected = selectedProfile === profile;
          return (
            <circle
              key={`${profile.referee}-${profile.season}-${profile.role}-${index}`}
              cx={xFor(profile.x)}
              cy={yFor(profile.y)}
              r={radius}
              tabIndex="0"
              className={`scatter-dot ${quadrant}${selected ? " selected" : ""}`}
              aria-label={`${profile.referee}, ${quadrantLabel(quadrant)}`}
              onMouseEnter={() => onSelectProfile(profile)}
              onFocus={() => onSelectProfile(profile)}
            />
          );
        }) : (
          <text x={margin.left} y={margin.top + 42} className="scatter-empty">No referee profiles were returned by the backend.</text>
        )}
      </svg>
    </div>
  );
}

export default function ConclusionsPage() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/api/metrics/conclusions/scatter`)
      .then((response) => {
        if (!response.ok) throw new Error(`Backend returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        setPayload(data);
        const leader = [...(data.profiles || [])].sort((a, b) => b.games_officiated - a.games_officiated)[0];
        setSelectedProfile(leader || null);
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });

    return () => {
      alive = false;
    };
  }, []);

  const profiles = payload?.profiles || [];
  const sampleLeader = useMemo(() => [...profiles].sort((a, b) => b.games_officiated - a.games_officiated)[0], [profiles]);

  return (
    <section id="future-page" className="site-page active" aria-label="Conclusions page">
      <section className="conclusions-stage glossy-conclusions">
        <div className="conclusions-copy">
          <p className="eyebrow">Conclusions</p>
          <h1>Which referee profiles stand out?</h1>
          <p>
            This view uses backend-calculated metric results to compare referee-season profiles. The graph utilizes a consistent regular-season sample with a minimum games threshold so each dot has enough volume to be worth interpreting.
          </p>

          <div className="conclusion-summary">
            <article className="glass-card">
              <span>Home-favorable profiles</span>
              <strong>{payload?.summary?.home_favorable ?? "--"}</strong>
              <small>Positive foul differential and positive adjusted home-bias index</small>
            </article>
            <article className="glass-card">
              <span>Road-favorable profiles</span>
              <strong>{payload?.summary?.road_favorable ?? "--"}</strong>
              <small>Negative foul differential and negative adjusted home-bias index</small>
            </article>
            <article className="glass-card">
              <span>Largest sample</span>
              <strong>{sampleLeader ? `${sampleLeader.referee.split(" ").slice(-1)[0]} (${formatNumber(sampleLeader.games_officiated, 0)})` : "--"}</strong>
              <small>Most games in the backend conclusion sample</small>
            </article>
          </div>

          <ProfileCard profile={selectedProfile} />
        </div>

        <div className="conclusions-graph">
          <section className="panel scatter-panel glass-panel">
            <div className="panel-header">
              <div>
                <h3>Backend metric quadrant map</h3>
                <p>{error ? `Unable to load graph: ${error}` : "Hover a dot to view the referee profile"}</p>
              </div>
              <span className="pill">{payload ? `${profiles.length} plotted` : "Loading"}</span>
            </div>
            <ScatterPlot profiles={profiles} selectedProfile={selectedProfile} onSelectProfile={setSelectedProfile} />
          </section>
          <div className="graph-conclusions">
            <article className="glass-card">
              <span>Graph overview</span>
              <p>The graph does not prove referee bias, but it highlights referee-season profiles whose foul differential and adjusted home-bias index are unusual enough to justify deeper game-level review.</p>
            </article>
            <article className="glass-card">
              <span>Center vs. edge</span>
              <p>Profiles closer to the center look more baseline. Profiles farther from the center are more noteworthy, especially with larger sample sizes.</p>
            </article>
            <article className="glass-card">
              <span>Mixed quadrants</span>
              <p>Dots in the upper-left or lower-right show disagreement between whistle profile and broader home-bias index, which means foul differential alone is not enough to explain the profile.</p>
            </article>
          </div>
        </div>
      </section>
    </section>
  );
}
