
import type { UserStats } from './types';

export const ranks = [
  { name: "Initiate", score: 0, icon: "Feather", color: "text-gray-400" },
  { name: "Analyst", score: 30, icon: "BarChart", color: "text-blue-400" },
  { name: "Sigma", score: 75, icon: "BrainCircuit", color: "text-indigo-400" },
  { name: "Apex", score: 150, icon: "Crown", color: "text-yellow-400" },
];

export const getRank = (trustScore: number | null | undefined) => {
    const score = trustScore ?? 0;
    return [...ranks].reverse().find(r => score >= r.score) || ranks[0];
};

export const calculateUserStats = (allEvents: any[], userBetsOnAllEvents: any[]): UserStats => {
    let wins = 0;
    let losses = 0;

    const sortedEvents = allEvents
        .map((event, index) => ({ event, bet: userBetsOnAllEvents[index] }))
        .filter(({ bet }) => bet.yesAmount > 0n || bet.noAmount > 0n)
        .sort((a, b) => (a.event.resolutionDate?.getTime() || 0) - (b.event.resolutionDate?.getTime() || 0));

    sortedEvents.forEach(({ event, bet }) => {
        if (event.status === 'finished' && event.winningOutcome) {
            const stakedOnYes = bet.yesAmount > 0n;
            const userWon = (stakedOnYes && event.winningOutcome === 'YES') || (!stakedOnYes && event.winningOutcome === 'NO');
            if (userWon) {
                wins++;
            } else {
                losses++;
            }
        }
    });

    const totalBets = wins + losses;
    const accuracy = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const trustScore = (wins * 5) - (losses * 2);

    return { wins, losses, totalBets, accuracy, trustScore };
};
