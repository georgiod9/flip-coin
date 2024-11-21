import { e8sToIcp, icpToE8s } from "./e8s";

interface WithdrawResponse {
    success: boolean;
    amount?: bigint;
    blockIndex?: bigint;
    error?: string;
}

export const withdrawRewards = async (amount: number, identifiedActor: any) => {
    try {
        const response = await identifiedActor.withdrawRewards(icpToE8s(amount));

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