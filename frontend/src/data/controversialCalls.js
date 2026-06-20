import bookerPlayoffVideo from "../../assets/bookerplayoff25-26.mp4";
import brownNoCallVideo from "../../assets/brownnocall25-26.mp4";
import brunsonNoCallVideo from "../../assets/brunsonnocall.mp4";
import horfordBadCallVideo from "../../assets/horfordbadcall.mp4";
import lebronNoCallVideo from "../../assets/lebronnocall.mp4";
import sgaNoCallVideo from "../../assets/sganocall.mp4";

export const controversialCalls = [
  {
    id: "booker-playoff-25-26",
    title: "Booker playoff tech",
    matchup: "First round 2026 playoffs: Suns vs Thunder",
    date: "April 22, 2026",
    callType: "Technical foul",
    severity: "Momentum shift",
    clipSrc: bookerPlayoffVideo,
    summary: "Devin Booker gets called for a tech trying to save a ball from going out of bounds in the first round of the 2025-26 playoffs vs the Thunder."
  },
  {
    id: "brown-no-call-25-26",
    title: "Brown no-call",
    matchup: "2025-26 regular season game",
    date: "March 10, 2026",
    callType: "No-call",
    severity: "Game Loss",
    clipSrc: brownNoCallVideo,
    summary: "Jalen Brown gets pushed by Stephon Castle out of bounds, but no call is made. Brown is visibly upset and gets ejected from the game after arguing with the refs. The Celtics end up losing the game by 9 points, and Brown gets fined 50k."
  },
  {
    id: "brunson-no-call",
    title: "Brunson no-call",
    matchup: "Game 5 NBA Finals 2026: Knicks vs Spurs",
    date: "June 13, 2026",
    callType: "No-call",
    severity: "Player safety",
    clipSrc: brunsonNoCallVideo,
    summary: "Jalen Brunson tweaks his foot on Victor Wembenyama's foot after landing after a three-point attempt, but no call is made. Wembanyama clearly sticks his foot out and causes Brunson to land awkwardly, but the refs miss the call."
  },
  {
    id: "horford-call",
    title: "Horford call review",
    matchup: "2025-26 regular season game",
    date: "January 2, 2026",
    callType: "Incorrect call",
    severity: "No impact on game outcome",
    clipSrc: horfordBadCallVideo,
    summary: "Al Horford gets called for a foul on an SGA drive attempt, but the replay clearly shows that Horford never made contact with SGA. The referee making the call was the furthest referee from the play, rather than the closest."
  },
  {
    id: "lebron-no-call",
    title: "LeBron no-call",
    matchup: "2022-23 regular season game",
    date: "January 28, 2023",
    callType: "No-call",
    severity: "Game Loss",
    clipSrc: lebronNoCallVideo,
    summary: "Lebron gets fouled on a drive attempt where Tatum clearly hits James' wrist with his hand, but no call is made. The Lakers end up losing the game in overtime and Eric Lewis, the referee who missed the call, retires following public scrutiny."
  },
  {
    id: "sga-no-call",
    title: "SGA no-call",
    matchup: "2025-26 regular season game",
    date: "March 4, 2026",
    callType: "Ignored Call",
    severity: "Potentially game-changing",
    clipSrc: sgaNoCallVideo,
    summary: "Brunson clearly takes a charge on an SGA drive attempt, but the refs ignore the call and let play continue, leading to an easy layup for SGA. The Thunder end up winning the game by 3 points."
  }
];
