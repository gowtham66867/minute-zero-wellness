export const MINIMUM_TEAM_COHORT = 5;

export type TeamPulseInput = {
  contributors: number;
  overloadSignals: number;
  fatigueSignals: number;
  recoveryBefore: number;
  recoveryAfter: number;
};

export type TeamPulse = {
  visible: boolean;
  contributors: number;
  focus: "overload" | "fatigue" | null;
  signalRate: number | null;
  action: string | null;
  impactPoints: number | null;
};

export function createTeamPulse(input: TeamPulseInput): TeamPulse {
  if (input.contributors < MINIMUM_TEAM_COHORT) {
    return { visible: false, contributors: input.contributors, focus: null, signalRate: null, action: null, impactPoints: null };
  }
  const focus = input.overloadSignals >= input.fatigueSignals ? "overload" : "fatigue";
  const count = focus === "overload" ? input.overloadSignals : input.fatigueSignals;
  return {
    visible: true,
    contributors: input.contributors,
    focus,
    signalRate: Math.round((count / input.contributors) * 100),
    action: focus === "overload" ? "Protect a 15-minute meeting-free recovery window" : "Protect break coverage for the next shift",
    impactPoints: Math.round((input.recoveryAfter - input.recoveryBefore) * 100),
  };
}

export const demoTeamPulse = createTeamPulse({ contributors: 13, overloadSignals: 8, fatigueSignals: 5, recoveryBefore: .38, recoveryAfter: .61 });
