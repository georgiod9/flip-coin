import { createContext, useContext, useEffect, useState } from "react";
import { useIdentity } from "../IdentityContext/IdentityContext";
// import LedgerApi from "../../api/ledger/LedgerApi";
import LedgerApi from "../../api/LedgerApi/LedgerApi";
import BackendApi from "../../api/BackendCanister/BackendCanister";
import { _SERVICE } from "../../../../declarations/icp_ledger_canister/icp_ledger_canister.did";
import { ActorSubclass } from "@dfinity/agent";
import { config } from "../../config/config";

interface TransferResult {
  success: boolean;
  message?: string;
  error?: string | null;
}
interface LedgerContextType {
  transfer: (amount: number, to: string) => Promise<TransferResult>;
  isTransferring: boolean;
  ledgerActor: ActorSubclass<_SERVICE> | null;
  error: string | null;
}

export const LedgerContext = createContext<LedgerContextType>(
  {} as LedgerContextType
);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { identity } = useIdentity();
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ledgerActor, setLedgerActor] =
    useState<ActorSubclass<_SERVICE> | null>(null);

  const initialize = async () => {
    if (!identity) {
      throw new Error("Identity not initialized");
    }
    const ledgerApi = await LedgerApi.create(identity);
    if (!ledgerApi) {
      throw new Error("Ledger API not initialized");
    }
    setLedgerActor(ledgerApi.actor);
  };

  const transfer = async (amountInIcp: number, to: string) => {
    setIsTransferring(true);
    setError(null);
    try {
      const ledgerApi = await LedgerApi.create(identity);
      if (!ledgerApi) {
        throw new Error("Ledger API not initialized");
      }
      const result = await ledgerApi.transfer(to, amountInIcp);
      return {
        success: true,
        message: "Transfer successful",
      };
    } catch (err: any) {
      setError(err.message);
      console.error(`error transferring icp: `, err);
      return {
        success: false,
        error:
          "An unknown error occurred. Please try again or contact support.",
      };
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (!identity) return;
    initialize();
  }, [identity]);

  return (
    <LedgerContext.Provider
      value={{ transfer, isTransferring, error, ledgerActor }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

// Hook
export const useLedger = () => useContext(LedgerContext);
