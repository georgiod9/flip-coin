import { Principal } from "@dfinity/principal";
import { FlipCoin_backend } from "../../../declarations/FlipCoin_backend";

/**
 * Validate a principal.
 * @param principal - The principal to validate.
 * @returns The validated principal or false if invalid.
 */
export const validatePrincipal = (principal: string) => {
    try {
        return Principal.fromText(principal);
    } catch (error) {
        return false;
    }
}

/**
 * Get the principal of the ICP ledger canister.
 * @returns The principal of the ICP ledger canister.
 */
export const getLedgerCanisterPrincipal = async () => {
    try {
        const ledgerPrincipal = await FlipCoin_backend.getICPLedgerId();
        return ledgerPrincipal;
    } catch (error) {
        return null;
    }
}

/**
 * Get the deposit address for a user from the ICP ledger canister.
 * @param identifiedActor - The identified ICP ledger actor.
 * @returns The deposit address for the user.
 */
export const getUserDepositAddress = async (identifiedActor: any) => {
    try {

        if (!identifiedActor) {
            throw new Error("Identified Actor not initialized.");
        }

        const depositAddr = await identifiedActor.getDepositAddress();
        return depositAddr;
    } catch (error) {
        return null;
    }
}