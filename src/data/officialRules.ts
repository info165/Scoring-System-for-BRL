// ========================================================
// OFFICIAL BHARAT ROBOTICS LEAGUE (BRL) 2026 SCORING SYSTEM
// Authoritative scoring definitions for 29 September 2026
// ========================================================

export interface BlockWeightDefinition {
  id: string;
  label: string;
  weightGrams: number;
  fullPoints: number;
  incompletePoints: number; // 50%
  description: string;
}

// The official 6 block weights used across BRL 2026
export const OFFICIAL_BLOCK_WEIGHTS: BlockWeightDefinition[] = [
  {
    id: '200g',
    label: '200 g',
    weightGrams: 200,
    fullPoints: 20,
    incompletePoints: 10,
    description: 'Light maneuverability block (Full: 20 pts, Incomplete: 10 pts)'
  },
  {
    id: '500g',
    label: '500 g',
    weightGrams: 500,
    fullPoints: 30,
    incompletePoints: 15,
    description: 'Medium balanced block (Full: 30 pts, Incomplete: 15 pts)'
  },
  {
    id: '700g',
    label: '700 g',
    weightGrams: 700,
    fullPoints: 40,
    incompletePoints: 20,
    description: 'Medium-heavy block (Full: 40 pts, Incomplete: 20 pts)'
  },
  {
    id: '1kg',
    label: '1 kg',
    weightGrams: 1000,
    fullPoints: 60,
    incompletePoints: 30,
    description: 'Heavy 1 kg challenge block (Full: 60 pts, Incomplete: 30 pts)'
  },
  {
    id: '2kg',
    label: '2 kg',
    weightGrams: 2000,
    fullPoints: 80,
    incompletePoints: 40,
    description: 'Super-heavy 2 kg friction block (Full: 80 pts, Incomplete: 40 pts)'
  },
  {
    id: '4kg',
    label: '4 kg',
    weightGrams: 4000,
    fullPoints: 100,
    incompletePoints: 50,
    description: 'Maximum legal 4 kg titan block (Full: 100 pts, Incomplete: 50 pts)'
  }
];

// --- EVENT 1: BLOCK PUSH CHALLENGE ---
// Theme: BLUE (#2563eb / #3b82f6)
export const BLOCK_PUSH_CONFIG = {
  eventName: 'Block Push Challenge',
  themeColor: 'blue',
  totalTimeSeconds: 120,
  maxTimeBonus: 120,
  timeBonusRate: 1, // 1 point per second left
  description: '120 seconds. Pushed completely inside box = 100% points. Any portion outside = 50% points. Time left = 1 pt/sec bonus.'
};

export interface BlockPushInputBlock {
  weightId: string;
  status: 'none' | 'complete' | 'incomplete';
}

export const calculateBlockPushScore = (
  blocks: BlockPushInputBlock[],
  timeLeftSeconds: number
) => {
  const safeTimeLeft = Math.max(0, Math.min(BLOCK_PUSH_CONFIG.totalTimeSeconds, Math.floor(timeLeftSeconds || 0)));
  const timeBonus = safeTimeLeft * BLOCK_PUSH_CONFIG.timeBonusRate;

  let blockScore = 0;
  const processedBlocks = OFFICIAL_BLOCK_WEIGHTS.map(def => {
    const matched = blocks.find(b => b.weightId === def.id);
    const status = matched ? matched.status : 'none';
    let points = 0;
    if (status === 'complete') points = def.fullPoints;
    else if (status === 'incomplete') points = def.incompletePoints;

    blockScore += points;
    return {
      weightId: def.id,
      weightLabel: def.label,
      status,
      pointsEarned: points
    };
  });

  const finalScore = blockScore + timeBonus;

  return {
    blocks: processedBlocks,
    blockScore,
    timeLeftSeconds: safeTimeLeft,
    timeBonus,
    finalScore,
    calculatedScore: finalScore
  };
};

// --- EVENT 2: BLOCK PULL CHALLENGE ---
// Theme: GREEN (#059669 / #10b981)
export const BLOCK_PULL_CONFIG = {
  eventName: 'Block Pull Challenge',
  themeColor: 'green',
  totalTimeSeconds: 120,
  maxTimeBonus: 120,
  timeBonusRate: 1, // 1 point per second left
  penaltyPerTouch: 5, // -5 pts per boundary touch
  description: '120 seconds. Full points per pulled block. Time left = 1 pt/sec bonus. Boundary touch = -5 pts penalty each.'
};

export const calculateBlockPullScore = (
  pulledBlockIds: string[],
  timeLeftSeconds: number,
  boundaryTouches: number
) => {
  const safeTimeLeft = Math.max(0, Math.min(BLOCK_PULL_CONFIG.totalTimeSeconds, Math.floor(timeLeftSeconds || 0)));
  const timeBonus = safeTimeLeft * BLOCK_PULL_CONFIG.timeBonusRate;
  const safeTouches = Math.max(0, Math.floor(boundaryTouches || 0));
  const boundaryPenalty = safeTouches * BLOCK_PULL_CONFIG.penaltyPerTouch;

  let blockScore = 0;
  pulledBlockIds.forEach(id => {
    const def = OFFICIAL_BLOCK_WEIGHTS.find(w => w.id === id);
    if (def) {
      blockScore += def.fullPoints;
    }
  });

  const rawTotal = blockScore + timeBonus - boundaryPenalty;
  const finalScore = Math.max(0, rawTotal);

  return {
    pulledBlockIds,
    blockScore,
    timeLeftSeconds: safeTimeLeft,
    timeBonus,
    boundaryTouches: safeTouches,
    boundaryPenalty,
    finalScore,
    calculatedScore: finalScore,
    penaltyPoints: boundaryPenalty
  };
};

// --- EVENT 3: ROBO WAR ---
// Theme: RED (#dc2626 / #ef4444)
export const ROBO_WAR_CONFIG = {
  eventName: 'Robo War',
  themeColor: 'red',
  totalTimeSeconds: 90,
  maxTimeSeconds: 90,
  inPitMultiplier: 3,
  outPitMultiplier: 2,
  description: '90 seconds head-to-head. Opponent in IN-PIT = Time Left × 3 pts. Opponent in OUT-PIT = Time Left × 2 pts. Loser receives 0 pts.'
};

export const calculateRoboWarScore = (
  winner: 'team_a' | 'team_b',
  pitType: 'in_pit' | 'out_pit',
  timeLeftSeconds: number
) => {
  const safeTimeLeft = Math.max(0, Math.min(ROBO_WAR_CONFIG.totalTimeSeconds, Math.floor(timeLeftSeconds || 0)));
  const multiplier = pitType === 'in_pit' ? ROBO_WAR_CONFIG.inPitMultiplier : ROBO_WAR_CONFIG.outPitMultiplier;
  const winnerPoints = safeTimeLeft * multiplier;
  const loserPoints = 0;

  return {
    multiplier,
    timeLeftSeconds: safeTimeLeft,
    teamAPoints: winner === 'team_a' ? winnerPoints : loserPoints,
    teamBPoints: winner === 'team_b' ? winnerPoints : loserPoints,
    winnerPoints,
    loserPoints
  };
};

// --- TIE HANDLING POLICY ---
// Rule: Do NOT invent or assume a tie-break rule.
// If two or more teams have exactly the same final score, display them as tied and flag the tie for organizer decision.
export const OFFICIAL_TIE_POLICY = {
  hasTieBreaker: false,
  message: 'TIE DETECTED: Multiple teams share identical total points. Awaiting official referee / organizer decision.'
};
