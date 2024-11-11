import { FlipCoin_backend, createActor } from "../../../declarations/FlipCoin_backend";
import { e8sToIcp } from "./e8s";


interface HouseStatistics {
    multiplier: number;
    historicalBets: number;
    historicalWinnings: number;
}

export const getHouseStatistics = async (): Promise<HouseStatistics | null> => {
    try {
        const stats = await FlipCoin_backend.getHouseStatistics();

        return {
            multiplier: Number(stats.multiplier),
            historicalBets: e8sToIcp(stats.historicalBets),
            historicalWinnings: e8sToIcp(stats.historicalWinnings)
        };
    } catch (error) {
        console.error(`getBalance: Error getting house statistics.`, error);
        return null;
    }
}