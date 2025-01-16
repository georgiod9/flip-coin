import { ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { backend_canister_id, internetIdentityConfig } from "../../config/config";
import { createActor } from "../../../../declarations/FlipCoin_backend";
import { _SERVICE } from "../../../../declarations/FlipCoin_backend/FlipCoin_backend.did";
import { FlipHistory, FlipStatistics } from "../../components/FlipHistory/FlipHistory";
import { Principal } from "@dfinity/principal";
import { e8sToIcp, icpToE8s } from "../../scripts/e8s";

interface DepositResult {
    success: boolean;
    amount?: bigint;
    error?: any;
}

class BackendApi {
    private static instance: BackendApi | null = null;
    private static currentIdentity: Identity | null = null;

    canisterId: string;
    actor: ActorSubclass<_SERVICE> | null;
    idenitified: boolean;
    identity: Identity | null;
    agent: HttpAgent | null;
    private constructor(identity: Identity | null, actor: ActorSubclass<_SERVICE> | null, isIdentified: boolean) {
        this.canisterId = backend_canister_id;
        this.actor = actor;
        this.identity = identity;
        this.idenitified = isIdentified;
        this.agent = null;
    }

    static async create(identity: Identity | null) {
        try {
            // Clear instance if identity has changed
            if (this.currentIdentity !== identity) {
                this.instance = null;
                this.currentIdentity = identity;
            }

            // Return existing instance if already created
            if (this.instance) return this.instance;

            // Create instance if not already created
            const agent = await HttpAgent.create({ identity: identity ? identity : undefined });
            const actor = createActor(backend_canister_id, {
                agent: agent
            });
            let isIdentified = false;

            console.log(`Identity:`, identity);
            if (identity && identity.getPrincipal().toText() !== internetIdentityConfig.loggedOutPrincipal) {
                isIdentified = true;
                console.log(`Created new actor with identity:`, identity.getPrincipal().toText());
            }
            else {
                isIdentified = false;
            }

            // Create new instance
            const mainApi = new BackendApi(identity, actor, isIdentified);
            mainApi.agent = agent;
            this.instance = mainApi;
            return mainApi;
        } catch (error) {
            console.error(`Error creating actor:`, error);
            return null;
        }
    }

    async getFlipHistory(): Promise<{ flipHistory: FlipHistory[], lastFlipId: number } | null> {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const lastFlipId = await this.actor.getLastFlipId();
            let start = Number(lastFlipId) - 10 > 0 ? Number(lastFlipId) - 10 : 0;

            const flipHistory = await this.actor.getFlipHistory(start, lastFlipId);
            return { flipHistory, lastFlipId };
        } catch (error) {
            console.log(`Error getting flip history:`, error)
            return null;
        }
    }

    async getStatistics(): Promise<FlipStatistics | null> {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const statistics = await this.actor.getStatistics();
            const result: FlipStatistics = {
                initialized: true,
                ...statistics
            }
            return result;
        } catch (error) {
            console.log(`Error getting statistics:`, error)
            return null;
        }
    }

    async getHouseBalance() {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const balance = await this.actor.getHouseBalance();
            return balance;
        } catch (error) {
            console.log(`Error getting house balance:`, error)
            return null;
        }
    }

    /**
     * Get the deposit address for a user from the ICP ledger canister.
     * @param identifiedActor - The identified ICP ledger actor.
     * @returns The deposit address for the user.
     */
    async getUserDepositAddress() {
        try {
            if (!this.identity) {
                throw new Error("Identity not initialized 2.");
            }
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }

            const depositAddr = await this.actor.getDepositAddress();
            return depositAddr;

        } catch (error) {
            console.log(`Error getting deposit address:`, error)
            return null;
        }
    }

    async depositIcp(): Promise<DepositResult> {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const deposit = await this.actor.depositIcp();

            if ('Ok' in deposit) {
                return {
                    success: true,
                    amount: deposit.Ok
                }
            }

            else {
                return {
                    success: false,
                    error: deposit.Err
                }
            }
        } catch (error: any) {
            console.log(`Error depositing ICP:`, error)
            return { success: false, error: error.toString() };
        }
    }

    async submitFlip(bidSide: boolean, bidAmountIcp: number) {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const response = await this.actor.submitFlip(bidSide, icpToE8s(bidAmountIcp));
            return response;
        } catch (error: any) {
            console.log(`Error submitting flip:`, error)
            return { success: false, error: error.toString() };
        }
    }

    async withdrawRewards(amount: number) {
        try {
            if (!this.actor) {
                throw new Error("Actor not initialized.");
            }
            const response = await this.actor.withdrawRewards(icpToE8s(amount));

            if ('Ok' in response) {
                return {
                    success: true,
                    amount: e8sToIcp(response.Ok.amount),
                    blockIndex: response.Ok.blockIndex
                }
            }

            if ('Err' in response) {
                if ('InsufficientBalance' in response.Err) {
                    return {
                        success: false,
                        error: 'Insufficient amount to withdraw.'
                    }
                }
                if ('TransferFailure' in response.Err) {
                    return {
                        success: false,
                        error: 'Failed to transfer ICP. Please try again or contact support.'
                    }
                }

                if ('SystemError' in response.Err) {
                    throw new Error('An error occurred while processing your withdrawal. Please try again or contact support.')
                }
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            }
        }
    }

}


export default BackendApi;
