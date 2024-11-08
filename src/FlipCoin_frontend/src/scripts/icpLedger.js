import { icp_ledger_canister } from "declarations/icp_ledger_canister";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as ledgerIDL } from "../../../declarations/icp_ledger_canister/icp_ledger_canister.did.js";
import { idlFactory as backendIDL } from '../../../declarations/FlipCoin_backend/FlipCoin_backend.did.js';

export const setupIdentifiedIcpLedger = (identifiedAgent) => {
    let actor = Actor.createActor(ledgerIDL, {
        agent: identifiedAgent,
        canisterId: process.env.CANISTER_ID_ICP_LEDGER_CANISTER
    });

    return actor;
}

export const setupIdentifiedBackendActor = (identifiedAgent) => {
    let actor = Actor.createActor(backendIDL, {
        agent: identifiedAgent,
        canisterId: process.env.CANISTER_ID_FLIPCOIN_BACKEND
    });

    return actor;
}