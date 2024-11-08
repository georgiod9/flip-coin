import { Principal } from "@dfinity/principal";
import { icp_ledger_canister } from "declarations/icp_ledger_canister";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
// Define the Account structure based on the candid definition

export const getWalletOnChainBalance = async (principal) => {
    try {
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

export const getCanisterIcpBalance = async (principal) => {
    try {
        const accountIdentifier = await icp_ledger_canister.account_identifier({ owner: Principal.fromText(principal), subaccount: [] })
        const balance = await icp_ledger_canister.account_balance({ account: accountIdentifier })


        console.log("Canister Balance:", balance);
        return balance.e8s;
    } catch (error) {
        console.error(`getBalance: Error getting wallet balance.`, error);
        return null;
    }
};


export const getFlipCoinCanisterBalance = async () => {
    try {

        console.log(`Attempting to get house balance....`)
        const houseBalance = await FlipCoin_backend.getHouseBalance();
        console.log(`House balance: `, houseBalance);

        return houseBalance.length > 0 ? houseBalance[0] : null;
    } catch (error) {
        console.error(`getBalance: Error getting wallet balance.`, error);
        return null;
    }
};

export const getFlipCoinCredits = async (identifiedActor) => {
    try {
        const balanceFlipcoin = await identifiedActor.retrieveAccountBalance();

        return balanceFlipcoin;
    } catch (error) {
        console.error(`getBalance: Error getting wallet balance.`, error);
        return null;
    }
};
