import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as ledgerIDL } from "../../../declarations/icp_ledger_canister/icp_ledger_canister.did.js";
import { idlFactory as backendIDL } from '../../../declarations/FlipCoin_backend/FlipCoin_backend.did.js';
import { Principal } from "@dfinity/principal";
import { validatePrincipal } from "./getPrincipal.js";
import { e8sToIcp, icpToE8s } from "./e8s.js";
import { InterfaceFactory } from "@dfinity/candid/lib/cjs/idl.js";
import { retrieveTransferFee } from "./fee.js";

/**
 * Setup the identified ICP ledger actor.
 * @param identifiedAgent - The identified agent.
 * @returns The identified ICP ledger actor.
 */
export const setupIdentifiedIcpLedger = (identifiedAgent: HttpAgent) => {
    // const canisterId = process.env.CANISTER_ID_ICP_LEDGER_CANISTER;
    const canisterId = "bkyz2-fmaaa-aaaaa-qaaaq-cai";
    if (!canisterId) {
        throw new Error(`ICP ledger canister id is not found. Make sure it is in the environment variables.`)
    }

    let actor = Actor.createActor(ledgerIDL as unknown as InterfaceFactory, {
        agent: identifiedAgent,
        canisterId: canisterId
    });

    return actor;
}

/**
 * Setup the identified backend actor.
 * @param identifiedAgent - The identified agent.
 * @returns The identified backend actor.
 */
export const setupIdentifiedBackendActor = (identifiedAgent: HttpAgent) => {
    // const canisterId = process.env.CANISTER_ID_FLIPCOIN_BACKEND;
    const canisterId = "be2us-64aaa-aaaaa-qaabq-cai"
    if (!canisterId) {
        throw new Error(`FlipCoin backend canister id is not found. Make sure it is in the environment variables.`);
    }

    let actor = Actor.createActor(backendIDL, {
        agent: identifiedAgent,
        canisterId: canisterId
    });

    return actor;
}

/**
 * Get the account identifier for a principal from the ICP ledger canister.
 * @param principal - The principal to get the account identifier for.
 * @param icpActor - The ICP ledger actor.
 * @returns The account identifier.
 */
const getAccountIdentifier = async (principal: Principal, icpActor: any) => {
    try {
        const accountIdentifier = await icpActor.account_identifier({
            owner: principal,
            subaccount: []
        });
        return accountIdentifier;
    } catch (error) {
        console.error(`Failed to get account identifier.`, error);
        throw error;
    }
}

/**
 * Transfer ICP from the caller to a destination principal.
 * @param icpAmount - The amount of ICP to transfer.
 * @param to - The destination principal to transfer the ICP to.
 * @param identifiedIcpActor - The ICP ledger actor.
 * @returns The result of the transfer.
 */
export const transferICP = async (icpAmount: number, to: string, identifiedIcpActor: any) => {
    const amountInE8s = icpToE8s(icpAmount);

    try {
        const destinationPrincipal = validatePrincipal(to);
        if (!destinationPrincipal) {
            return {
                success: false,
                error: 'Invalid destination principal'
            }
        }

        const accountIdentifier = await getAccountIdentifier(destinationPrincipal, identifiedIcpActor);
        const transferArgs = {
            to: accountIdentifier,
            from_subaccount: [],
            created_at_time: [],
            memo: BigInt(0x1),
            amount: { e8s: amountInE8s },
            fee: { e8s: retrieveTransferFee() },
        };

        const result = await identifiedIcpActor.transfer(transferArgs);

        if (result.Ok) {
            return {
                success: true,
                message: 'Transfer successful'
            }
        }
        return {
            success: false,
            error: 'An unknown error occurred. Please try again or contact support.'
        }

    } catch (error) {
        console.error("Error during transfer:", error);
        return {
            success: false,
            error: 'An unknown error occurred. Please try again or contact support.'
        }
    }
};