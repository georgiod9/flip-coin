import { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import BackendApi from "../BackendCanister/BackendCanister";


class AccountApi {
    constructor() {
    }

    async getAccountCredits(identity: Identity | null) {
        const mainApi = await BackendApi.create(identity);
        if (!mainApi) {
            throw new Error("Failed to create main api");
        }

        const credits = await mainApi.actor?.getCredits();

        return credits;
    }


}

export default AccountApi;
