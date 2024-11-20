import { e8sToIcp, icpToE8s } from "./e8s";
import { retrieveTransferFee } from "./fee";
import { getUserDepositAddress } from "./getPrincipal";

interface DepositReceipt {
  success: boolean;
  amount?: bigint;
  error?: string;
}

export const depositTokens = async (identifiedActor: any): Promise<{
  success: boolean,
  amount?: bigint,
  error?: string
}> => {
  try {
    const deposit = await identifiedActor.depositIcp();
    if ('Ok' in deposit) {
      return {
        success: true,
        amount: deposit.Ok
      }
    }
    if ('Err' in deposit) {
      if ('BalanceLow' in deposit.Err) {
        return {
          success: false,
          error: 'Insufficient balance in deposit account. Please transfer ICP first'
        }
      }
      if ('TransferFailure' in deposit.Err) {
        return {
          success: false,
          error: 'Failed to transfer ICP. Please try again or contact support.'
        }
      }
    }
    return {
      success: false,
      error: 'An unknown error occurred. Please try again or contact support.'
    }
  } catch (error) {
    return {
      success: false,
      error: 'An unknown error occurred. Please try again or contact support.'
    }
  }
}

export const transferTokens = async (amount: number, identifiedActor: any, identifiedIcpActor: any): Promise<DepositReceipt> => {
  const amountInE8s = icpToE8s(
    parseFloat((amount + e8sToIcp(retrieveTransferFee())).toString())
  );

  console.log(`Amount in e8s`, amountInE8s);
  try {
    // Retrieve deposit address
    const userDepositAddress = await getUserDepositAddress(identifiedActor);

    console.log(`userDepositAddress`, userDepositAddress);

    const transferArgs = {
      to: userDepositAddress,
      from_subaccount: [],
      created_at_time: [],
      memo: BigInt(0x1),
      amount: { e8s: BigInt(Number(amountInE8s) + retrieveTransferFee()) },
      fee: { e8s: retrieveTransferFee() },
    };
    console.log(`transferArgs`, transferArgs);

    const result = await identifiedIcpActor.transfer(transferArgs);
    console.log("Transfer token result:", result);
    console.log("Transfer token result.ok:", result.Ok);

    return await depositTokens(identifiedActor);

  } catch (error) {
    console.error("Error during transfer:", error);
    return {
      success: false,
      error: 'An unknown error occurred. Please try again or contact support.'
    }
  }
};