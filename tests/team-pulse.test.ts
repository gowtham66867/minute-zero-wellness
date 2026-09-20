import assert from "node:assert/strict";
import test from "node:test";
import { MINIMUM_TEAM_COHORT, createTeamPulse } from "../lib/team-pulse.ts";

test("team pulse never exposes a cohort below the privacy threshold", () => {
  const pulse = createTeamPulse({ contributors: MINIMUM_TEAM_COHORT - 1, overloadSignals: 4, fatigueSignals: 1, recoveryBefore: .3, recoveryAfter: .5 });
  assert.equal(pulse.visible, false);
  assert.equal(pulse.action, null);
});

test("overload pulse recommends a recovery window and measures improvement", () => {
  const pulse = createTeamPulse({ contributors: 10, overloadSignals: 7, fatigueSignals: 4, recoveryBefore: .38, recoveryAfter: .61 });
  assert.equal(pulse.visible, true);
  assert.equal(pulse.focus, "overload");
  assert.equal(pulse.signalRate, 70);
  assert.match(pulse.action || "", /15-minute/);
  assert.equal(pulse.impactPoints, 23);
});

test("fatigue pulse recommends protected break coverage", () => {
  const pulse = createTeamPulse({ contributors: 10, overloadSignals: 3, fatigueSignals: 6, recoveryBefore: .5, recoveryAfter: .55 });
  assert.equal(pulse.focus, "fatigue");
  assert.match(pulse.action || "", /break coverage/);
});
