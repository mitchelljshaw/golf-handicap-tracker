import assert from "node:assert";
import { recommendClubsForHole, type ClubDistanceInput } from "./clubRecommendation";

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    throw err;
  }
}

const bag: ClubDistanceInput[] = [
  { clubName: "Driver", distanceMeters: 230 },
  { clubName: "3 Wood", distanceMeters: 200 },
  { clubName: "5 Iron", distanceMeters: 160 },
  { clubName: "7 Iron", distanceMeters: 140 },
  { clubName: "9 Iron", distanceMeters: 120 },
  { clubName: "Pitching Wedge", distanceMeters: 100 },
];

check("returns null with no yardage or no clubs", () => {
  assert.strictEqual(recommendClubsForHole(null, 4, bag), null);
  assert.strictEqual(recommendClubsForHole(150, 3, []), null);
});

check("par 3: recommends the closest club by distance", () => {
  const rec = recommendClubsForHole(141, 3, bag);
  assert.strictEqual(rec?.teeClub, "7 Iron");
  assert.strictEqual(rec?.approachClub, null);
});

check("par 3: ties break toward the longer club", () => {
  // 130 is exactly 10m from both 9 Iron (120) and 7 Iron (140)
  const rec = recommendClubsForHole(130, 3, bag);
  assert.strictEqual(rec?.teeClub, "7 Iron");
});

check("par 5: recommends driver and a matching approach club", () => {
  const rec = recommendClubsForHole(480, 5, bag);
  assert.strictEqual(rec?.teeClub, "Driver");
  // 480 - 230 = 250m left -> closest club is still Driver (230) among this bag
  assert.strictEqual(rec?.approachClub, "Driver");
});

check("par 4: a drivable hole suggests laying back off the tee", () => {
  // 240m is within the driver + 20m margin -> lay back with 3 Wood
  const rec = recommendClubsForHole(240, 4, bag);
  assert.strictEqual(rec?.teeClub, "3 Wood");
  // 240 - 200 = 40m left -> closest club distance-wise
  assert.strictEqual(rec?.approachClub, "Pitching Wedge");
});

check("par 4: a normal-length hole uses driver, not a lay-back", () => {
  const rec = recommendClubsForHole(340, 4, bag);
  assert.strictEqual(rec?.teeClub, "Driver");
  // 340 - 230 = 110m left -> closest is 9 Iron (120) vs PW (100), 9i is 10 away, PW is 10 away -> reduce() keeps first closer-or-equal match (9 Iron encountered first in array)
  assert.ok(["9 Iron", "Pitching Wedge"].includes(rec!.approachClub!));
});

console.log(`\n${passed} passed`);
