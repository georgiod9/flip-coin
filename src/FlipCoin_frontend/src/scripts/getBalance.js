import { Principal } from "@dfinity/principal";
import { icp_ledger_canister } from "declarations/icp_ledger_canister";

// Define the Account structure based on the candid definition

export const getWalletOnChainBalance = async (principal) => {
    try {
        // const principal = Principal.fromText(principalText);
        const accountIdentifier = {
            owner: principal,
            subaccount: [],
        };

        // Call the icrc1_balance_of function with the account identifier
        const walletBalance = await icp_ledger_canister.icrc1_balance_of(accountIdentifier);
        console.log("Wallet Balance:", walletBalance);
        return walletBalance;
    } catch (error) {
        console.error(`getBalance: Error getting wallet balance.`, error);
        return null;
    }
};


export const getFlipCoinCredits = async (identifiedActor) => {
    try {
        const balanceFlipcoin = await identifiedActor.retrieveAccountBalance();
        console.log(`balance flipcoin:`, balanceFlipcoin);

        return balanceFlipcoin;
    } catch (error) {
        console.error(`getBalance: Error getting wallet balance.`, error);
        return null;
    }
};
