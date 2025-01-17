import { Identity } from "@dfinity/agent";
import LedgerApi from "../api/LedgerApi/LedgerApi";
import { e8sToIcp, icpToE8s } from "./e8s";
import { retrieveTransferFee } from "./fee";
import { getUserDepositAddress } from "./getPrincipal";
import BackendApi from "../api/BackendCanister/BackendCanister";

interface DepositReceipt {
  success: boolean;
  amount?: bigint;
  error?: string;
}

export const depositTokens = async (identity: Identity): Promise<{
  success: boolean,
  amount?: bigint,
  error?: string
}> => {
  try {
    const backendApi = await BackendApi.create(identity);
    if (!backendApi) {
      throw new Error("Backend API not found");
    }

    const deposit = await backendApi.depositIcp();
    // const deposit = await ledgerApi.depositIcp();
    if (deposit.success) {
      return {
        success: true,
        amount: deposit.amount
      }
    }
    else {
      if ('BalanceLow' in deposit.error) {
        return {
          success: false,
          error: 'Insufficient balance in deposit account. Please transfer ICP first'
        }
      }
      if ('TransferFailure' in deposit.error) {
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

export const transferTokens = async (amount: number, identifiedActor: any, identifiedIcpActor: any, identity: Identity): Promise<DepositReceipt> => {
  const amountInE8s = icpToE8s(
    parseFloat((amount + e8sToIcp(retrieveTransferFee())).toString())
  );

  try {
    // Retrieve deposit address
    const userDepositAddress = await getUserDepositAddress(identifiedActor);


    const transferArgs = {
      to: userDepositAddress,
      from_subaccount: [],
      created_at_time: [],
      memo: BigInt(0x1),
      amount: { e8s: BigInt(Number(amountInE8s) + retrieveTransferFee()) },
      fee: { e8s: retrieveTransferFee() },
    };

    const ledgerApi = await LedgerApi.create(identity);
    if (!ledgerApi) {
      throw new Error("Ledger API not found");
    }

    const result = await ledgerApi.transfer(userDepositAddress, amount);

    return await depositTokens(identity);

  } catch (error) {
    console.error("Error during transfer:", error);
    return {
      success: false,
      error: 'An unknown error occurred. Please try again or contact support.'
    }
  }
};