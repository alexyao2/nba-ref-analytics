import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, getSeasons } from "../services/api.js";
import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";

function quadrantFor(profile) {
  if (profile.x >= 0 && profile.y >= 0) return "home";
  if (profile.x < 0 && profile.y < 0) return "road";
  if (profile.x < 0 && profile.y >= 0) return "mixed-home";
  return "mixed-road";
}

function quadrantLabel(value) {
  return {
    home: "Home whistle + home team favored outcomes",
    road: "Road whistle + road team favored outcomes",
    "mixed-home": "Road whistle + home team favored outcomes",
    "mixed-road": "Home whistle + road team favored outcomes"
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

function ProfileTooltip({ profile, style }) {
  if (!profile) return null;

  const quadrant = quadrantFor(profile);
  return (
    <div className="profile-tooltip visible react-profile-tooltip" style={style} role="status">
      <strong>{profile.referee}</strong>
      <p>{profile.season} {splitLabel(profile.split)} · {profile.role || "Role unavailable"} · {formatNumber(profile.games_officiated, 0)} games</p>
      <dl>
        <div><dt>Quadrant</dt><dd>{quadrantLabel(quadrant)}</dd></div>
        <div><dt>Foul diff.</dt><dd>{formatNumber(profile.foul_differential_road_minus_home, 2)}</dd></div>
        <div><dt>Adjusted index</dt><dd>{formatNumber(profile.confidence_adjusted_index, 2)}</dd></div>
      </dl>
    </div>
  );
}

function ScatterPlot({ profiles, selectedProfile, onSelectProfile }) {
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [lockedTooltip, setLockedTooltip] = useState(null);
  const graphRef = useRef(null);
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
  const tooltipFor = (profile, x, y) => {
    const bounds = graphRef.current?.getBoundingClientRect();
    const tooltipWidth = Math.min(248, Math.max(180, (bounds?.width || 0) - 24));
    const tooltipHeight = 190;
    const dotX = (x / width) * (bounds?.width || width);
    const dotY = (y / height) * (bounds?.height || height);
    const maxLeft = Math.max(12, (bounds?.width || width) - tooltipWidth - 12);
    const maxTop = Math.max(12, (bounds?.height || height) - tooltipHeight - 12);
    const left = Math.min(maxLeft, Math.max(12, dotX + 14));
    const top = Math.min(maxTop, Math.max(12, dotY + 14));

    return {
      profile,
      style: {
        left: `${left}px`,
        top: `${top}px`
      }
    };
  };

  const showProfile = (profile, x, y) => {
    onSelectProfile(profile);
    setHoveredTooltip(tooltipFor(profile, x, y));
  };

  const pinProfile = (profile, x, y) => {
    const nextTooltip = tooltipFor(profile, x, y);
    setLockedTooltip((current) => current?.profile === profile ? null : nextTooltip);
    onSelectProfile(profile);
  };

  const tooltip = lockedTooltip || hoveredTooltip;

  return (
    <div ref={graphRef} className="scatter-svg-wrap" aria-label="Interactive four quadrant referee scatter plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="conclusionScatterTitle conclusionScatterDesc">
        <title id="conclusionScatterTitle">Whistle direction map</title>
        <desc id="conclusionScatterDesc">Referee profiles plotted by whistle direction and home-leaning results index.</desc>
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
        <text x={centerX + 16} y={margin.top + 24} className="scatter-label label-home">Home whistle</text>
        <text x={centerX + 16} y={margin.top + 42} className="scatter-label label-home">Home-leaning results</text>
        <text x={margin.left + 16} y={margin.top + 24} className="scatter-label label-mixed-home">Road whistle</text>
        <text x={margin.left + 16} y={margin.top + 42} className="scatter-label label-mixed-home">Home-leaning results</text>
        <text x={margin.left + 16} y={margin.top + plotHeight - 36} className="scatter-label label-road">Road whistle</text>
        <text x={margin.left + 16} y={margin.top + plotHeight - 18} className="scatter-label label-road">Road-leaning results</text>
        <text x={centerX + 16} y={margin.top + plotHeight - 36} className="scatter-label label-mixed-road">Home whistle</text>
        <text x={centerX + 16} y={margin.top + plotHeight - 18} className="scatter-label label-mixed-road">Road-leaning results</text>
        <text x={centerX - 148} y={height - 24} className="scatter-axis-label">Whistle direction: road whistle ← → home whistle</text>
        <text x={-centerY - 132} y="24" transform="rotate(-90)" className="scatter-axis-label">Results index: road-leaning → home-leaning</text>

        {profiles.length ? profiles.map((profile, index) => {
          const quadrant = quadrantFor(profile);
          const radius = 5 + Math.sqrt(profile.games_officiated / maxGames) * 9;
          const selected = selectedProfile === profile;
          const x = xFor(profile.x);
          const y = yFor(profile.y);
          return (
            <circle
              key={`${profile.referee}-${profile.season}-${profile.role}-${index}`}
              cx={x}
              cy={y}
              r={radius}
              tabIndex="0"
              className={`scatter-dot ${quadrant}${selected ? " selected" : ""}`}
              aria-label={`${profile.referee}, ${quadrantLabel(quadrant)}`}
              onMouseEnter={() => showProfile(profile, x, y)}
              onFocus={() => showProfile(profile, x, y)}
              onClick={() => pinProfile(profile, x, y)}
              onMouseLeave={() => setHoveredTooltip(null)}
              onBlur={() => setHoveredTooltip(null)}
            />
          );
        }) : (
          <text x={margin.left} y={margin.top + 42} className="scatter-empty">No referee profiles were returned by the backend.</text>
        )}
      </svg>
      <ProfileTooltip profile={tooltip?.profile} style={tooltip?.style} />
    </div>
  );
}

export default function ConclusionsPage() {
  const [payload, setPayload] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [error, setError] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    getSeasons()
      .then(({ seasons: availableSeasons = [] }) => {
        if (!alive) return;
        setSeasons(availableSeasons);
        setSelectedSeason(availableSeasons[0] || "");
      })
      .catch((err) => {
        if (alive) setError(err.message);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;

    let alive = true;
    setError("");
    setPayload(null);
    setSelectedProfile(null);
    fetch(`${API_BASE}/api/metrics/conclusions/scatter?season=${encodeURIComponent(selectedSeason)}`)
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
  }, [selectedSeason]);

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
            <video muted autoPlay loop playsInline preload="metadata" width="450" height="290" poster="/assets/nba-logo-design.jpg">
              <source src="/assets/logovideo.mp4" type="video/mp4"/>
            </video>

        </div>

        <div className="conclusions-graph">
          <section className="panel scatter-panel glass-panel">
            <div className="panel-header">
              <div>
                <h3>Whistle direction map</h3>
                <p>{error ? `Unable to load graph: ${error}` : "Hover a dot to view the referee profile"}</p>
              </div>
              <div className="scatter-controls">
                <label>
                  <span>Season</span>
                  <select value={selectedSeason} onChange={(event) => setSelectedSeason(event.target.value)} disabled={!seasons.length}>
                    {seasons.map((season) => <option key={season} value={season}>{season}</option>)}
                  </select>
                </label>
                <span className="pill">{payload ? `${profiles.length} plotted` : "Loading"}</span>
              </div>
            </div>
            <ScatterPlot key={selectedSeason} profiles={profiles} selectedProfile={selectedProfile} onSelectProfile={setSelectedProfile} />
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
          <section className="findings-section" aria-labelledby="findings-heading">
            <div className="findings-heading">
              <p className="eyebrow">Findings</p>
            </div>
            <div className="findings-grid">
              <article className="glass-card">
                <span>General</span>
                <p>This graph identifies referee-season profiles whose foul differential and confidence-adjusted home-bias metrics differ enough from their season baseline to warrant closer review. In the 2025-26 sample, James Capers averaged approximately 2.1 more fouls called against road teams than home teams, while Simone Jelks averaged approximately 1.4 more fouls against home teams. These results do not establish intent or bias. Instead, they identify profiles that can be examined through more specific evidence, including game film, play-by-play context, media reporting, and player or coach comments.</p>
              </article>
              <article className="glass-card">
                <span>Specific Referees</span>
                <p>Several officials, including Scott Foster, Tony Brothers, and John Goble, have received sustained public scrutiny. Their positions on the 2025-26 graph provide context for that discussion by comparing their referee-season profiles with other officials working under the same regular-season conditions. If we take a look at where they fall, they are quite average compared to fellow referees. This shows that it isn’t the frequency of calls that they’re making that is drawing criticism: it’s the specific calls that they make or don’t make that creates discussion.</p>
              </article>
              <article className="glass-card">
                <span>Final Thoughts</span>
                <p>It’s important to note that there are many factors that affect these numbers and we should be careful in jumping to conclusions too quickly. Home court advantage can impact the way referees make decisions, not just how well players perform - fans, emotions, and the basketball game itself can all have significant impact. Down the stretch of a close game, calls can be very tricky to call, and it’s paramount to realize how small certain margins are. On the other hand, a string of terrible miscalls and no calls have plagued the league this season and it’s obvious. Fans are arguing, players are frustrated, coaches are getting thrown from games trying to defend their players. From the standpoint of a fan, it’s difficult to watch a seemingly “scripted” sport without wanting to really analyze the numbers. I hope these findings can draw realizations for other fans wanting the same closure. 
WhistleRate is meant to provide that context: not to conclude that games are scripted or that a referee is biased, but to show which patterns deserve a closer, more evidence-based look.</p>
              </article>
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
