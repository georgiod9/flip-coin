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

interface BackendProviderProps {
  children: ReactNode;
}

interface BackendContextType {
  isRefreshingFlipHistory: boolean;
  isRefreshingStatistics: boolean;
  isRefreshingHouseBalance: boolean;
  lastFlipId: number;
  flipHistory: FlipHistory[];
  statistics: FlipStatistics;
  houseBalance: number | null;
  refreshAllBalances: () => Promise<void>;
  refreshFlipHistory: () => Promise<FlipHistory[]>;
  refreshHouseBalance: () => Promise<number>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: BackendProviderProps) {
  const { identity } = useIdentity();
  const [houseBalance, setHouseBalance] = useState<number | null>(null);

  const [isRefreshingFlipHistory, setIsRefreshingFlipHistory] = useState(false);
  const [isRefreshingStatistics, setIsRefreshingStatistics] = useState(false);
  const [isRefreshingHouseBalance, setIsRefreshingHouseBalance] =
    useState(false);
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState<FlipHistory[]>([]);
  const [statistics, setStatistics] = useState<FlipStatistics>({
    initialized: false,
    headsCount: 0,
    headsRate: 0,
    tailsCount: 0,
    tailsRate: 0,
  });

  const refreshFlipHistory = async () => {
    try {
      setIsRefreshingFlipHistory(true);
      const backendApi = await BackendApi.create(identity);
      const flipHistory = await backendApi?.getFlipHistory();
      if (!flipHistory) {
        return [];
      }

      setLastFlipId(flipHistory.lastFlipId);
      setFlipHistory(flipHistory.flipHistory);
      return flipHistory.flipHistory;
    } catch (error) {
      console.log(`Error getting flip history: `, error);
      return [];
    } finally {
      setIsRefreshingFlipHistory(false);
    }
  };

  const refreshStatistics = async () => {
    try {
      setIsRefreshingStatistics(true);
      const backendApi = await BackendApi.create(identity);
      const statistics = await backendApi?.getStatistics();
      if (!statistics) {
        setStatistics({
          initialized: false,
          headsCount: 0,
          headsRate: 0,
          tailsCount: 0,
          tailsRate: 0,
        });
        return;
      }
      setStatistics(statistics);
      return statistics;
    } catch (error) {
      console.log(`Error getting statistics: `, error);
      return [];
    } finally {
      setIsRefreshingStatistics(false);
    }
  };

  const refreshHouseBalance = async () => {
    try {
      setIsRefreshingHouseBalance(true);
      const backendApi = await BackendApi.create(identity);
      const balance = await backendApi?.getHouseBalance();
      if (!balance) {
        setHouseBalance(0);
        return 0;
      }
      setHouseBalance(balance);
      return balance;
    } catch (error) {
      console.log(`Error getting house balance: `, error);
      return null;
    } finally {
      setIsRefreshingHouseBalance(false);
    }
  };

  const refreshAllBalances = async () => {
    refreshFlipHistory();
    refreshStatistics();
    refreshHouseBalance();
  };

  useEffect(() => {
    const refresh = async () => {
      refreshAllBalances();
    };
    refresh();
  }, []);

  return (
    <BackendContext.Provider
      value={{
        isRefreshingFlipHistory,
        isRefreshingStatistics,
        isRefreshingHouseBalance,
        houseBalance,
        lastFlipId,
        flipHistory,
        statistics,
        refreshFlipHistory,
        refreshAllBalances,
        refreshHouseBalance,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}
export function useBackend() {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
}
