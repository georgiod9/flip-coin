import { Actor } from '@dfinity/agent';
import { idlFactory } from '../../../../declarations/icp_ledger_canister';
import type { _SERVICE } from '../../../../declarations/icp_ledger_canister/icp_ledger_canister.did';
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

export class ICPLedger {
    public actor: _SERVICE;

    constructor(agent: HttpAgent, canisterId: Principal) {
        this.actor = Actor.createActor<_SERVICE>(idlFactory, {
            agent: agent,
            canisterId: canisterId
        });
    }

    async getBalance(principal: Principal) {
        try {
            const accountIdentifier = {
                owner: principal,
                subaccount: [],
            };

            // Call the icrc1_balance_of function with the account identifier
            const walletBalance = await this.actor.icrc1_balance_of(accountIdentifier);
            return walletBalance;
        } catch (error) {
            console.error(`getBalance: Error getting wallet balance.`, error);
            return null;
        }
    }
}
