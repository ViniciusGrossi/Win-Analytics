export interface MonteCarloParams {
  initialBankroll: number;
  winRate: number; // e.g., 0.55 for 55%
  averageOdd: number; // e.g., 1.95
  stake: number; // Fixed stake amount
  numBets: number; // Number of future bets to simulate
  numPaths: number; // Number of simulation paths
}

export interface MonteCarloResult {
  paths: number[][]; // Array of paths, where each path is an array of bankroll values
  averagePath: number[];
  ruinProbability: number;
  expectedProfit: number;
  bestCase: number;
  worstCase: number;
}

export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
  const {
    initialBankroll,
    winRate,
    averageOdd,
    stake,
    numBets,
    numPaths,
  } = params;

  const paths: number[][] = [];
  const expectedPath: number[] = new Array(numBets + 1).fill(0).map((_, i) => {
    // Expected value per bet = (winRate * (averageOdd - 1) * stake) - ((1 - winRate) * stake)
    const evPerBet = (winRate * (averageOdd - 1) * stake) - ((1 - winRate) * stake);
    return initialBankroll + (i * evPerBet);
  });

  let ruinCount = 0;
  let totalEndBankroll = 0;
  let bestCase = -Infinity;
  let worstCase = Infinity;

  // We limit paths visually to max 100 on frontend for performance, but calculate stats on all
  const visualPathsLimit = 100;
  const visualPaths = [];

  for (let p = 0; p < numPaths; p++) {
    let currentBankroll = initialBankroll;
    const currentPath = [currentBankroll];
    let isRuin = false;

    for (let b = 1; b <= numBets; b++) {
      if (currentBankroll <= 0) {
        isRuin = true;
        currentPath.push(0);
        continue;
      }

      const won = Math.random() < winRate;
      if (won) {
        currentBankroll += stake * (averageOdd - 1);
      } else {
        currentBankroll -= stake;
      }

      currentPath.push(currentBankroll);
    }

    if (isRuin) {
      ruinCount++;
    }

    if (p < visualPathsLimit) {
      visualPaths.push(currentPath);
    }

    totalEndBankroll += currentBankroll;
    
    if (currentBankroll > bestCase) bestCase = currentBankroll;
    if (currentBankroll < worstCase) worstCase = currentBankroll;
  }

  return {
    paths: visualPaths, // For chart rendering
    averagePath: expectedPath,
    ruinProbability: (ruinCount / numPaths) * 100,
    expectedProfit: (totalEndBankroll / numPaths) - initialBankroll,
    bestCase,
    worstCase: worstCase < 0 ? 0 : worstCase,
  };
}
