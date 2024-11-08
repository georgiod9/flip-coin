import { Actor, HttpAgent, Identity } from '@dfinity/agent';
import { DelegationChain, Ed25519KeyIdentity, DelegationIdentity } from '@dfinity/identity';
import { IdbStorage, LocalStorage } from '@dfinity/auth-client';

class AuthStore {
    static instance: AuthStore | null = null;

    constructor() {

    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new AuthStore();
        }
        return this.instance;
    }

    getAgent() {

    }

    async getIdentity() {
        // const storage: LocalStorage = new LocalStorage('ic-');
        const storage: IdbStorage = new IdbStorage();

        const identityKey: string | null = await storage.get('identity');
        const delegationChain: string | null = await storage.get('delegation');

        console.log(`Identity key.....`, identityKey)
        console.log(`delegationChain.....`, delegationChain)

        const chain: DelegationChain = DelegationChain.fromJSON(delegationChain!);
        const key: Ed25519KeyIdentity = Ed25519KeyIdentity.fromJSON(identityKey!);

        const identity: Identity = DelegationIdentity.fromDelegation(key, chain);
        return identity;
    }

    getIdentifiedActor() {

    }

    setIdentity(identity: Identity) {

    }

    setIdentifiedActor(actor: Actor) {

    }

    setAgent(Agent: HttpAgent) {

    }
}


export default AuthStore;