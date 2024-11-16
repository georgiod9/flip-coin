import Types "types";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Bool "mo:base/Bool";

module {
    private let BASE_REWARD_MULTIPLIER : Nat64 = 95; // 95% base payout
    private let MAX_REWARD_MULTIPLIER : Nat64 = 97; // Maximum 97% payout
    private let MIN_REWARD_MULTIPLIER : Nat64 = 90; // Minimum 90% payout

    private let TARGET_EDGE_MIN : Float = 3.0; // Minimum 3% edge
    private let TARGET_EDGE_MAX : Float = 7.0; // Maximum 7% edge

    private let MIN_HOUSE_COVERAGE_RATIO = 10.0; // House must have at least 10x the max possible payout
    private let MAX_BET_RATIO = 0.01; // Maximum bet can be 1% of house balance

    public class House() {
        public func calculateReward(bidAmount_e8s : Nat64, rewardMultiplier : Nat64) : Nat64 {
            return (bidAmount_e8s * rewardMultiplier) / 100;
        };

        public func hasCoverage(houseBalance : Nat, bidAmount : Nat64, rewardMultiplier : Nat64) : Bool {
            let potentialPayout = calculateReward(bidAmount, rewardMultiplier);

            return Float.fromInt(houseBalance) >= Float.fromInt(Nat64.toNat(potentialPayout)) * MIN_HOUSE_COVERAGE_RATIO;
        };

        public func calculateMaxBet(houseBalance : Nat) : Nat64 {
            let maxBetFloat = Float.fromInt(houseBalance) * MAX_BET_RATIO;
            Debug.print("[_calculateMaxBet]: Max bet is " # Float.toText(maxBetFloat));
            return Nat64.fromNat(Int.abs(Float.toInt(maxBetFloat)));
        };

        private func _calculateHouseEdge(totalHistoricalBets : Nat, totalHistoricalWinnings : Nat) : Float {
            if (totalHistoricalBets == 0) return 0;

            let edge = (Float.fromInt(totalHistoricalBets - totalHistoricalWinnings) / Float.fromInt(totalHistoricalBets)) * 100.0;
            return edge;
        };

        public func calculateRewardMultiplier(totalHistoricalBets : Nat, totalHistoricalWinnings : Nat) : Nat64 {
            let currentEdge = _calculateHouseEdge(totalHistoricalBets, totalHistoricalWinnings);

            if (currentEdge < TARGET_EDGE_MIN) {
                let adjustment = Float.min(TARGET_EDGE_MIN - currentEdge, 5.0);
                let newMultiplier = Float.max(Float.fromInt(Nat64.toNat(MIN_REWARD_MULTIPLIER)), Float.fromInt(Nat64.toNat(BASE_REWARD_MULTIPLIER)) - adjustment);

                Debug.print("Adjusting reward multiplier down to " # Float.toText(newMultiplier));
                return Nat64.fromNat(Int.abs(Float.toInt(newMultiplier)));
            } else if (currentEdge > TARGET_EDGE_MAX) {
                let adjustment = Float.min(currentEdge - TARGET_EDGE_MAX, 5.0);
                let newMultiplier = Float.min(Float.fromInt(Nat64.toNat(MAX_REWARD_MULTIPLIER)), Float.fromInt(Nat64.toNat(BASE_REWARD_MULTIPLIER)) + adjustment);

                Debug.print("Adjusting reward multiplier up to " # Float.toText(newMultiplier));
                return Nat64.fromNat(Int.abs(Float.toInt(newMultiplier)));
            } else {
                Debug.print("Reward multiplier is within target range. No adjustment needed.");
                return BASE_REWARD_MULTIPLIER;
            };
        };

    };

};
