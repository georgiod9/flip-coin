import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";

import {
  FlipHistory,
  FlipStatistics,
} from "../../components/FlipHistory/FlipHistory";
import BackendApi from "../../api/BackendCanister/BackendCanister";
import { useIdentity } from "../IdentityContext/IdentityContext";
import AccountApi from "../../api/AccountApi/AccountApi";
import { ICPLedger } from "../../api/ICPLedger/ICPLedger";
import { icp_ledger_canister_id } from "../../config/config";
import { Principal } from "@dfinity/principal";

interface AccountProviderProps {
  children: ReactNode;
}

interface AccountContextType {
  isRefreshingCreditBalance: boolean;
  credits: number;
  isRefreshingOnChainBalance: boolean;
  onChainBalance: number;
  resetBalances: () => void;
  refreshCreditBalance: () => Promise<number>;
  refreshOnChainBalance: () => Promise<number>;
  refreshAll: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: AccountProviderProps) {
  const { identity } = useIdentity();
  const [isRefreshingCreditBalance, setIsRefreshingCreditBalance] =
    useState(false);
  const [credits, setCredits] = useState(0);
  const [onChainBalance, setOnChainBalance] = useState(0);
  const [isRefreshingOnChainBalance, setIsRefreshingOnChainBalance] =
    useState(false);

  const refreshCreditBalance = async () => {
    try {
      setIsRefreshingCreditBalance(true);
      const accountApi = new AccountApi();

      const result = await accountApi.getAccountCredits(identity);
      if (!result) {
        setCredits(0);
        return;
      }
      setCredits(result);
      return result;
    } catch (error) {
      console.log(`Error getting wallet credits: `, error);
      return [];
    } finally {
      setIsRefreshingCreditBalance(false);
    }
  };

  const refreshOnChainBalance = async () => {
    try {
      if (!identity) {
        throw new Error("Identity not initialized");
      }

      const backendApi = await BackendApi.create(identity);
      if (!backendApi) {
        throw new Error("Backend API not initialized");
      }
      const agent = backendApi.agent;
      if (!agent) {
        throw new Error("Agent not initialized");
      }

      setIsRefreshingOnChainBalance(true);
      const ledgerApi = new ICPLedger(
        agent,
        Principal.fromText(icp_ledger_canister_id)
      );

      const balance = await ledgerApi.getBalance(identity.getPrincipal());
      console.log(`Balance: `, balance);
      setOnChainBalance(balance);
      return balance;
    } catch (error) {
      console.error(`Error getting on-chain balance: `, error);
      return 0;
    } finally {
      setIsRefreshingOnChainBalance(false);
    }
  };

  const resetBalances = () => {
    setCredits(0);
    setOnChainBalance(0);
  };

  const refreshAll = async () => {
    refreshCreditBalance();
    refreshOnChainBalance();
  };

  useEffect(() => {
    const refresh = async () => {
      if (!identity) return;
      refreshAll();
    };
    refresh();
  }, [identity]);

  return (
    <AccountContext.Provider
      value={{
        credits,
        isRefreshingCreditBalance,
        refreshCreditBalance,
        onChainBalance,
        isRefreshingOnChainBalance,
        refreshOnChainBalance,
        refreshAll,
        resetBalances,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within a AccountProvider");
  }
  return context;
}
