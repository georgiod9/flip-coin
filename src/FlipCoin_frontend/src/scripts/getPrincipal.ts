import { FlipCoin_backend } from "../../../declarations/FlipCoin_backend";


export const getLedgerCanisterPrincipal = async () => {
    try {
        const ledgerPrincipal = await FlipCoin_backend.getICPLedgerId();
        return ledgerPrincipal;
    } catch (error) {
        return null;
    }
}

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