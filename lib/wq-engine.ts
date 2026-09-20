export type Pillar = "stress" | "movement" | "sleep" | "nourishment" | "connection" | "purpose";

export type CheckIn = {
  mentalLoad: number;
  energy: number;
  minutes: 1 | 3 | 5 | 10;
  pillar: Pillar | "choose";
};

export type Outcome = {
  interventionId: string;
  pillar: Pillar;
  before: number;
  after: number;
  at: string;
};

export type Intervention = {
  id: string;
  pillar: Pillar;
  title: string;
  promise: string;
  steps: string[];
  bestFor: string;
  minMinutes: number;
  loadRange: [number, number];
  energyRange: [number, number];
};

export const interventions: Intervention[] = [
  { id: "long-exhale", pillar: "stress", title: "Downshift", promise: "Longer exhales and a physical release to lower the immediate noise.", bestFor: "high mental load", minMinutes: 1, loadRange: [6, 10], energyRange: [1, 10], steps: ["Breathe in gently for four", "Exhale slowly for six", "Drop your shoulders and name one next action"] },
  { id: "orient-reset", pillar: "stress", title: "Orient", promise: "Use the room around you to interrupt a spiralling attention loop.", bestFor: "racing thoughts", minMinutes: 3, loadRange: [5, 10], energyRange: [2, 8], steps: ["Find five calm or neutral things you can see", "Notice three sounds without judging them", "Return to the smallest useful next step"] },
  { id: "mobilise", pillar: "movement", title: "Wake the system", promise: "A low-friction movement reset without demanding a workout.", bestFor: "low energy", minMinutes: 1, loadRange: [1, 8], energyRange: [1, 5], steps: ["Stand and reach overhead", "March or walk briskly", "Shake out your hands and reset your posture"] },
  { id: "screen-sunset", pillar: "sleep", title: "Land the day", promise: "Reduce stimulation and give tomorrow a clean starting point.", bestFor: "tired but wired", minMinutes: 5, loadRange: [4, 10], energyRange: [1, 6], steps: ["Lower the screen brightness and look away", "Write down what can wait until tomorrow", "Take six unforced slow breaths"] },
  { id: "steady-fuel", pillar: "nourishment", title: "Steady first", promise: "Check the basics before asking your body for more output.", bestFor: "energy dips", minMinutes: 3, loadRange: [1, 8], energyRange: [1, 5], steps: ["Drink a few slow sips of water", "Notice when you last ate without judgement", "Choose the next balanced option available to you"] },
  { id: "human-signal", pillar: "connection", title: "Reach, lightly", promise: "Turn isolation into one small moment of human contact.", bestFor: "feeling alone", minMinutes: 3, loadRange: [3, 10], energyRange: [2, 8], steps: ["Think of one safe person", "Send a simple: ‘Could use a hello today’", "Let receiving support count as action"] },
  { id: "true-north", pillar: "purpose", title: "True north", promise: "Reconnect the next tiny action to something that matters.", bestFor: "drift or indecision", minMinutes: 3, loadRange: [1, 8], energyRange: [3, 10], steps: ["Name the value you want to act from", "Choose an action small enough for today", "Say when and where you will begin"] },
  { id: "micro-pause", pillar: "stress", title: "One clean minute", promise: "The smallest reset for when capacity is almost gone.", bestFor: "very low capacity", minMinutes: 1, loadRange: [7, 10], energyRange: [1, 4], steps: ["Put both feet on the floor", "Take one longer exhale", "Make the next demand ten percent smaller"] },
];

const preferredPillar = (checkIn: CheckIn): Pillar => {
  if (checkIn.pillar !== "choose") return checkIn.pillar;
  if (checkIn.mentalLoad >= 7) return "stress";
  if (checkIn.energy <= 4) return "movement";
  return "purpose";
};

export function recommend(checkIn: CheckIn, outcomes: Outcome[]) {
  const pillar = preferredPillar(checkIn);
  const scored = interventions.map(intervention => {
    let score = intervention.pillar === pillar ? 42 : 0;
    score += checkIn.minutes >= intervention.minMinutes ? 18 : -40;
    if (checkIn.mentalLoad >= intervention.loadRange[0] && checkIn.mentalLoad <= intervention.loadRange[1]) score += 16;
    if (checkIn.energy >= intervention.energyRange[0] && checkIn.energy <= intervention.energyRange[1]) score += 12;
    const matches = outcomes.filter(outcome => outcome.interventionId === intervention.id);
    const averageShift = matches.length ? matches.reduce((sum, outcome) => sum + Math.max(0, outcome.before - outcome.after), 0) / matches.length : 0;
    score += Math.min(18, averageShift * 6);
    return { intervention, score, matches: matches.length, averageShift };
  }).sort((a, b) => b.score - a.score);

  const winner = scored[0];
  const confidence = winner.matches >= 3 ? "personalized" : outcomes.length >= 3 ? "learning" : "exploring";
  const reasons = [
    `Matches your ${pillar} signal`,
    `Fits ${checkIn.minutes} minute${checkIn.minutes === 1 ? "" : "s"}`,
    winner.matches ? `Worked ${winner.matches} time${winner.matches === 1 ? "" : "s"} for you` : "Ready to learn from your response",
  ];
  return { ...winner, pillar, confidence, reasons, alternatives: scored.slice(1, 3).map(item => item.intervention) };
}

export function pillarSignals(checkIn: CheckIn, outcomes: Outcome[]) {
  const learned = outcomes.reduce<Record<Pillar, number>>((result, outcome) => {
    result[outcome.pillar] += Math.max(0, outcome.before - outcome.after) * 2;
    return result;
  }, { stress: 0, movement: 0, sleep: 0, nourishment: 0, connection: 0, purpose: 0 });
  return {
    stress: Math.min(10, Math.round(checkIn.mentalLoad + learned.stress / 8)),
    movement: Math.min(10, Math.round((11 - checkIn.energy) * .8 + learned.movement / 8)),
    sleep: Math.min(10, Math.round((11 - checkIn.energy) * .55 + checkIn.mentalLoad * .25)),
    nourishment: Math.min(10, Math.round((11 - checkIn.energy) * .48)),
    connection: Math.min(10, Math.round(checkIn.mentalLoad * .42 + learned.connection / 8)),
    purpose: Math.min(10, Math.round(checkIn.mentalLoad * .35 + (11 - checkIn.energy) * .25)),
  };
}

export const demoOutcomes: Outcome[] = [
  { interventionId: "long-exhale", pillar: "stress", before: 8, after: 5, at: "2026-09-14T09:30:00.000Z" },
  { interventionId: "long-exhale", pillar: "stress", before: 7, after: 5, at: "2026-09-15T13:10:00.000Z" },
  { interventionId: "long-exhale", pillar: "stress", before: 9, after: 6, at: "2026-09-16T16:40:00.000Z" },
  { interventionId: "mobilise", pillar: "movement", before: 6, after: 4, at: "2026-09-17T10:20:00.000Z" },
  { interventionId: "true-north", pillar: "purpose", before: 6, after: 5, at: "2026-09-18T08:00:00.000Z" },
];
