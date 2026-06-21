import { useEffect, useMemo, useState } from "react";
import {
  getFoulDifferentialLeaders,
  getOverviewMetrics,
  getReferees,
  getSeasons,
  getSplits,
  normalizeApiReferee
} from "../services/api.js";
import { filteredRecords } from "../services/filters.js";
import { aggregateByReferee, scoreClass } from "../services/refereeMetrics.js";
import { formatNumber, formatPct, splitLabel } from "../data/normalize.js";
import { RoleMixChart, WorkloadChart } from "./DashboardCharts.jsx";

const defaultFilters = { season: "all", split: "all", minGames: 1, query: "" };
const sortLabels = {
  games_desc: "Most Games",
  games_asc: "Fewest Games",
  alpha: "Alphabetical"
};

function nextSortMode(sortMode) {
  if (sortMode === "games_desc") return "games_asc";
  if (sortMode === "games_asc") return "alpha";
  return "games_desc";
}

function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card glass-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Watchlist({ leaders }) {
  if (!leaders.length) return <p className="empty">No backend leader rows match the current filters.</p>;

  return leaders.map((leader) => {
    const value = Number(leader.foul_differential_road_minus_home || 0);
    return (
      <article className="watch-card glass-card" key={`${leader.referee}-${leader.season}-${leader.role}`}>
        <div className="watch-score">
          <strong>{leader.referee}</strong>
          <span className={`score-chip ${scoreClass(Math.max(0, 100 - Math.abs(value) * 12))}`}>{formatNumber(value, 1)}</span>
        </div>
        <div className="bar"><span style={{ width: `${Math.min(100, Math.max(8, Math.abs(value) * 20))}%` }}></span></div>
        <span>{leader.season} · {splitLabel(leader.split)} · {leader.games_officiated} games · {leader.role || "role n/a"}</span>
      </article>
    );
  });
}

function RefTable({ groups }) {
  return (
    <tbody>
      {groups.length ? groups.map((group) => (
        <tr key={`${group.referee}-${group.season}-${group.split}-${group.role}`}>
          <td><strong>{group.referee}</strong></td>
          <td>{group.season}</td>
          <td>{splitLabel(group.split)}</td>
          <td>{group.role || "--"}</td>
          <td>{group.gamesOfficiated}</td>
          <td>{formatPct(group.homeTeamWinPct)}</td>
          <td>{formatNumber(group.calledFoulsPerGame, 1)}</td>
          <td>{formatNumber(group.foulDifferentialRoadMinusHome, 1)}</td>
        </tr>
      )) : <tr><td colSpan="8">No referee rows match the current filters.</td></tr>}
    </tbody>
  );
}

function RecordCards({ records }) {
  const rows = [...records].sort((a, b) => (b.gamesOfficiated || 0) - (a.gamesOfficiated || 0)).slice(0, 48);
  if (!rows.length) return <p className="empty">No season records match the current filters.</p>;

  return rows.map((record) => (
    <article className="game-card glass-card" key={`${record.referee}-${record.season}-${record.split}-${record.role}`}>
      <strong>{record.referee}</strong>
      <span className="game-meta">{record.season} · {splitLabel(record.split)} · {record.role || "role n/a"}</span>
      <div className="game-stats">
        <span>Games <b>{record.gamesOfficiated ?? "--"}</b></span>
        <span>Home win <b>{formatPct(record.homeTeamWinPct)}</b></span>
        <span>Fouls/gm <b>{formatNumber(record.calledFoulsPerGame, 1)}</b></span>
      </div>
      <span className="game-meta">Home diff {formatNumber(record.homeTeamPointDifferential, 1)} · Foul diff {formatNumber(record.foulDifferentialRoadMinusHome, 1)}</span>
    </article>
  ));
}

export default function DashboardPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [activeView, setActiveView] = useState("overview");
  const [sortMode, setSortMode] = useState("games_desc");
  const [seasons, setSeasons] = useState([]);
  const [splits, setSplits] = useState([]);
  const [records, setRecords] = useState([]);
  const [overview, setOverview] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSeasons(), getSplits()])
      .then(([seasonPayload, splitPayload]) => {
        setSeasons(seasonPayload.seasons || []);
        setSplits(splitPayload.splits || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    Promise.all([
      getReferees(filters),
      getOverviewMetrics(filters),
      getFoulDifferentialLeaders(filters, 3)
    ])
      .then(([rows, overviewPayload, leadersPayload]) => {
        if (!alive) return;
        setRecords(rows.map(normalizeApiReferee));
        setOverview(overviewPayload);
        setLeaders(leadersPayload.leaders || []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message);
        setRecords([]);
        setOverview(null);
        setLeaders([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [filters]);

  const displayRecords = useMemo(() => filteredRecords(records, {
    ...filters,
    season: "all",
    split: "all",
    minGames: 1
  }), [records, filters]);

  const workloadGroups = useMemo(() => aggregateByReferee(displayRecords, true), [displayRecords]);

  const groups = useMemo(() => {
    const grouped = aggregateByReferee(displayRecords, sortMode !== "games_asc");

    if (sortMode !== "alpha") return grouped;

    return [...grouped].sort((a, b) => (
      a.referee.localeCompare(b.referee)
      || b.season.localeCompare(a.season)
      || splitLabel(a.split).localeCompare(splitLabel(b.split))
      || (a.role || "").localeCompare(b.role || "")
    ));
  }, [displayRecords, sortMode]);
  const seasonCount = new Set(displayRecords.map((record) => record.season)).size;

  return (
    <section id="data-page" className="site-page active" aria-label="Data dashboard page">
      <section className="subpage-hero">
        <div>
          <p className="eyebrow">Data dashboard</p>
          <h1>Explore NBA referee stats.</h1>
        </div>
        <div className="top-actions">
          <button id="resetData" type="button" onClick={() => setFilters(defaultFilters)}>Reset</button>
        </div>
      </section>

      <section className="platform-section dashboard-page-section">
        <div className="app-shell glass-shell">
          <aside className="sidebar" aria-label="Dashboard controls">
            <div className="sidebar-block">
              <strong>Dashboard views</strong>
              <nav className="nav-tabs" aria-label="Views">
                {["overview", "referees", "games", "model"].map((view) => (
                  <button className={`nav-tab${activeView === view ? " active" : ""}`} key={view} type="button" onClick={() => setActiveView(view)}>
                    {view === "games" ? "Records" : view === "model" ? "Schema" : view[0].toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="control-group">
              <label htmlFor="seasonFilter">Season</label>
              <select id="seasonFilter" value={filters.season} onChange={(event) => setFilters({ ...filters, season: event.target.value })}>
                <option value="all">All seasons</option>
                {seasons.map((season) => <option value={season} key={season}>{season}</option>)}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="teamFilter">Split</label>
              <select id="teamFilter" value={filters.split} onChange={(event) => setFilters({ ...filters, split: event.target.value })}>
                <option value="all">All splits</option>
                {splits.map((split) => <option value={split} key={split}>{splitLabel(split)}</option>)}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="minGames">Min games</label>
              <input id="minGames" type="range" min="1" max="72" value={filters.minGames} onChange={(event) => setFilters({ ...filters, minGames: Number(event.target.value) })} />
              <output>{filters.minGames}</output>
            </div>

            <div className="control-group">
              <label htmlFor="searchInput">Search</label>
              <input id="searchInput" type="search" placeholder="Referee or game" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
            </div>

            <div className="data-card">
              <strong>Data inputs</strong>
              <span>NBAstuffer referee stats</span>
              <span>Backend-owned CSV parsing</span>
              <span>{loading ? "Loading API data" : error ? "Backend unavailable" : "FastAPI connected"}</span>
            </div>
          </aside>

          <div className="main-content">
            {activeView === "overview" && (
              <section className="view active" aria-label="Overview">
                <div className="metric-grid">
                  <MetricCard label="Avg Home Win Rate" value={formatPct(overview?.avg_home_win_pct)} note={overview ? "From backend weighted metrics" : "Backend weighted metric"} />
                  <MetricCard label="Called Fouls/Game" value={formatNumber(overview?.avg_fouls_per_game, 1)} note="Weighted average" />
                  <MetricCard label="Home Point Diff." value={formatNumber(overview?.avg_home_pts_diff, 1)} note="Weighted average" />
                  <MetricCard label="Total Games" value={formatNumber(overview?.total_games, 0)} note="Across matching rows" />
                </div>

                <div className="dashboard-grid">
                  <section className="panel wide glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Workload Leaders</h3>
                        <p>Most games officiated in the selected data</p>
                      </div>
                      <span className="pill">{overview ? `${overview.total_rows} rows · ${seasonCount} seasons` : error || "Loading backend data"}</span>
                    </div>
                    <WorkloadChart groups={workloadGroups} />
                  </section>

                  <section className="panel glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Role Mix</h3>
                        <p>Share of games by referee role</p>
                      </div>
                    </div>
                    <RoleMixChart records={displayRecords} />
                  </section>

                  <section className="panel wide glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Largest Foul Differentials</h3>
                        <p>Rows with the biggest road-minus-home foul gap</p>
                      </div>
                    </div>
                    <div className="watchlist"><Watchlist leaders={leaders} /></div>
                  </section>
                </div>
              </section>
            )}

            {activeView === "referees" && (
              <section className="view active" aria-label="Referees">
                <div className="panel glass-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Referee Rows</h3>
                      <p>Ranked by games officiated</p>
                    </div>
                    <button type="button" onClick={() => setSortMode(nextSortMode(sortMode))}>Sort: {sortLabels[sortMode]}</button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Referee</th>
                          <th>Season</th>
                          <th>Split</th>
                          <th>Role</th>
                          <th>Games</th>
                          <th>Home Win %</th>
                          <th>Fouls/Game</th>
                          <th>Foul Diff.</th>
                        </tr>
                      </thead>
                      <RefTable groups={groups} />
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeView === "games" && (
              <section className="view active" aria-label="Records">
                <div className="panel glass-panel">
                  <div className="panel-header">
                    <div>
                      <h3>Season Records</h3>
                      <p>Top matching referee-season rows from NBAstuffer</p>
                    </div>
                  </div>
                  <div className="game-grid"><RecordCards records={displayRecords} /></div>
                </div>
              </section>
            )}

            {activeView === "model" && (
              <section className="view active" aria-label="Model">
                <div className="model-grid">
                  <section className="panel glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Source Coverage</h3>
                        <p>Public NBAstuffer referee-stat pages currently embedded</p>
                      </div>
                    </div>
                    <dl className="definitions">
                      <div><dt>Seasons</dt><dd>2016-17 regular season through 2025-26, plus the public 2017 playoffs page.</dd></div>
                      <div><dt>Rows</dt><dd>Each row represents a referee, season/split, and role combination from the source tables.</dd></div>
                      <div><dt>Limitations</dt><dd>This source does not include no-call audits, coach challenge outcomes, or media records.</dd></div>
                      <div><dt>Future data</dt><dd>Additional seasons and data points may be added as they become publicly available.</dd></div>
                    </dl>
                  </section>

                  <section className="panel glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>Dashboard Calculations</h3>
                        <p>Weighted by games officiated</p>
                      </div>
                    </div>
                    <div className="formula-box">
                      <code>weighted average = sum(metric * games_officiated) / sum(games_officiated)</code>
                    </div>
                    <dl className="definitions">
                      <div><dt>Home Win Rate</dt><dd>Percentage of games won by the home team in rows matching the current filters.</dd></div>
                      <div><dt>Foul Differential</dt><dd>NBAstuffer&apos;s road-team foul percentage minus home-team foul percentage expression.</dd></div>
                    </dl>
                  </section>

                  <section className="panel wide glass-panel">
                    <div className="panel-header">
                      <div>
                        <h3>CSV Schema</h3>
                        <p>Embedded from NBAstuffer public referee tables</p>
                      </div>
                    </div>
                    <div className="schema">
                      {["season", "split", "referee", "role", "gender", "experience_years", "games_officiated", "home_team_win_pct", "home_team_point_differential", "total_points_per_game", "called_fouls_per_game", "foul_pct_against_road_teams", "foul_pct_against_home_teams", "foul_differential_road_minus_home"].map((field) => <span key={field}>{field}</span>)}
                    </div>
                  </section>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
