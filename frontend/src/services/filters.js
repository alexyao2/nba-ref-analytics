import { splitLabel } from "../data/normalize.js";

export function filteredRecords(records, filters) {
  return records.filter((record) => {
    const seasonMatch = filters.season === "all" || record.season === filters.season;
    const splitMatch = filters.split === "all" || record.split === filters.split;
    const gamesMatch = (record.gamesOfficiated || 0) >= filters.minGames;
    const haystack = `${record.referee} ${record.role} ${record.gender} ${record.season} ${splitLabel(record.split)}`.toLowerCase();

    return seasonMatch && splitMatch && gamesMatch && haystack.includes(filters.query.toLowerCase());
  });
}
