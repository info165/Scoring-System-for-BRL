export interface WeightTier {
  id: string;
  name: string;
  weightRange: string;
  basePoints: number;
  description: string;
}

export interface PullTier {
  id: string;
  name: string;
  weight: string;
  basePoints: number;
  description: string;
}

export interface ZoneOption {
  id: 'outer' | 'middle' | 'bullseye';
  label: string;
  multiplier: number;
  description: string;
}

export interface DistanceOption {
  id: 'full' | 'three_quarters' | 'half' | 'quarter';
  label: string;
  multiplier: number;
  description: string;
}

export const OFFICIAL_BLOCK_PUSH_TIERS: WeightTier[] = [
  {
    id: 'push_tier_1',
    name: 'Category 1: Light Block',
    weightRange: '100g - 250g',
    basePoints: 20,
    description: 'Precision maneuverability tier for rapid placement.'
  },
  {
    id: 'push_tier_2',
    name: 'Category 2: Medium Block',
    weightRange: '251g - 500g',
    basePoints: 40,
    description: 'Balanced mass challenge testing chassis torque.'
  },
  {
    id: 'push_tier_3',
    name: 'Category 3: Heavy Block',
    weightRange: '501g - 1000g (1 kg)',
    basePoints: 70,
    description: 'High friction payload demanding high-traction drivetrains.'
  },
  {
    id: 'push_tier_4',
    name: 'Category 4: Super Heavy Block',
    weightRange: '1001g - 1750g (1.75 kg)',
    basePoints: 110,
    description: 'Dense metal block requiring high torque transmission.'
  },
  {
    id: 'push_tier_5',
    name: 'Category 5: Titan Mega Block',
    weightRange: '1751g - 2500g (2.5 kg)',
    basePoints: 160,
    description: 'Maximum legal competition block payload for peak pushing power.'
  }
];

export const OFFICIAL_PUSH_ZONES: ZoneOption[] = [
  {
    id: 'outer',
    label: 'Outer Scoring Perimeter',
    multiplier: 1.0,
    description: 'Block pushed fully past arena baseline (1.0x Base Points)'
  },
  {
    id: 'middle',
    label: 'Intermediate Target Zone',
    multiplier: 1.5,
    description: 'Block situated inside the marked secondary square (1.5x Base Points)'
  },
  {
    id: 'bullseye',
    label: 'Center Bullseye Zone',
    multiplier: 2.0,
    description: 'Block centered in the high-value bullseye target (2.0x Base Points)'
  }
];

export const OFFICIAL_PUSH_BONUSES = {
  cleanAutonomousRun: 20, // Zero manual intervention or flawless alignment
  speedUnder60s: 15,      // Course completed within 60 seconds
};

export const OFFICIAL_PUSH_PENALTIES = {
  boundaryBreach: 5,      // Touching arena boundary markers per incident
  robotManualReset: 15,   // Touching the bot for mechanical reset
};

export const OFFICIAL_BLOCK_PULL_TIERS: PullTier[] = [
  {
    id: 'pull_tier_1',
    name: 'Tier 1: 1.0 kg Sled Tow',
    weight: '1.0 kg',
    basePoints: 40,
    description: 'Standard friction drag sled over the rubberized pulling lane.'
  },
  {
    id: 'pull_tier_2',
    name: 'Tier 2: 2.0 kg Sled Tow',
    weight: '2.0 kg',
    basePoints: 75,
    description: 'Intermediate weight test evaluating wheel adhesion and motor gearing.'
  },
  {
    id: 'pull_tier_3',
    name: 'Tier 3: 3.0 kg Sled Tow',
    weight: '3.0 kg',
    basePoints: 115,
    description: 'Heavy duty pull requiring specialized high-torque gearboxes.'
  },
  {
    id: 'pull_tier_4',
    name: 'Tier 4: 4.0 kg Heavy Titan',
    weight: '4.0 kg',
    basePoints: 160,
    description: 'Extreme drag resistance testing structural rigidity under tension.'
  },
  {
    id: 'pull_tier_5',
    name: 'Tier 5: 5.0 kg Maximum Load',
    weight: '5.0 kg',
    basePoints: 210,
    description: 'Maximum arena towing capacity for elite robotics engineering.'
  }
];

export const OFFICIAL_PULL_DISTANCES: DistanceOption[] = [
  {
    id: 'full',
    label: '100% Full Arena Lane (Finished)',
    multiplier: 1.0,
    description: 'Complete crossing of the finish line marker'
  },
  {
    id: 'three_quarters',
    label: '75% Distance Marker Reached',
    multiplier: 0.75,
    description: 'Sled crossed the 75% mark before timeout'
  },
  {
    id: 'half',
    label: '50% Distance Marker Reached',
    multiplier: 0.50,
    description: 'Sled crossed the halfway mark before timeout'
  },
  {
    id: 'quarter',
    label: '25% Distance Marker Reached',
    multiplier: 0.25,
    description: 'Initial launch achieved but stalled before halfway'
  }
];

export const OFFICIAL_PULL_BONUSES = {
  sub45sSpeed: 25,     // Completed full tow under 45 seconds
  zeroWheelSlip: 15,   // Flawless continuous traction
};

export const OFFICIAL_PULL_PENALTIES = {
  laneBoundaryTouch: 10,  // Touching the side safety rails
  cableHitchDisconnect: 20 // Sled decoupling requiring stoppage
};

export const OFFICIAL_ROBOT_WAR_RULES = {
  knockout: {
    label: 'Knockout / Arena Out / Immobilization',
    winnerPoints: 100,
    loserPoints: 20,
    description: 'Opponent robot pushed out of the arena pit, flipped, or immobilized for >10 seconds.'
  },
  judgesDecision: {
    label: 'Judges Decision (Points / Damage & Control)',
    winnerPoints: 75,
    loserPoints: 35,
    description: 'Full round elapsed with both robots active; judges award decision on aggression and arena control.'
  },
  draw: {
    label: 'Double Immobilization / Technical Draw',
    teamAPoints: 50,
    teamBPoints: 50,
    description: 'Simultaneous failure or neutral stalemate after full regulation period.'
  },
  disqualification: {
    label: 'Rule Infraction / Disqualification',
    winnerPoints: 90,
    loserPoints: 0,
    description: 'Severe rule violation, weapon breach, or safety cutoff activation.'
  }
};

export const OFFICIAL_TIE_BREAK_POLICY = [
  '1. Primary: Cumulative Total Points (Round 1 + Round 2 + Round 3)',
  '2. Tie-Breaker 1: Highest Round 3 (Robot War) Points',
  '3. Tie-Breaker 2: Highest Round 2 (Block Pull) Points',
  '4. Tie-Breaker 3: Highest Round 1 (Block Push) Points',
  '5. Tie-Breaker 4: Lowest Cumulative Penalties Incurred across all stages'
];
