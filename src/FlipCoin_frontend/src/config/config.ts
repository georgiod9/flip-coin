export const config = {
    identityProvider: "http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943/",
    loggedOutPrincipal: "2vxsx-fae",
    loginExpiry: 1, // in days
}

export const backend_canister_id = process.env.CANISTER_ID_FLIPCOIN_BACKEND || "";
export const icp_ledger_canister_id = process.env.CANISTER_ID_ICP_LEDGER_CANISTER || "";
export const internet_identity_canister_id = process.env.CANISTER_ID_INTERNET_IDENTITY || "";
export const internetIdentityConfig = {
    identityProvider: `http://${internet_identity_canister_id}.localhost:4943/`,
    loggedOutPrincipal: "2vxsx-fae",
    loginExpiryInHours: 1, // in hours
}
