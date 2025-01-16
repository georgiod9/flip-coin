import { createContext, useContext, ReactNode, useState } from "react";

interface StateProviderProps {
  children: ReactNode;
}

interface StateContextType {
  hasPending: boolean;
  pendingTasks: string[];
  addPendingTask: (task: string) => void;
  removePendingTask: (task: string) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: StateProviderProps) {
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);

  const addPendingTask = (task: string) => {
    setPendingTasks((prev) => [...prev, task]);
  };

  const removePendingTask = (task: string) => {
    setPendingTasks((prev) => prev.filter((t) => t !== task));
  };

  return (
    <StateContext.Provider
      value={{
        hasPending: pendingTasks.length > 0,
        pendingTasks,
        addPendingTask,
        removePendingTask,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}
export function useStateProvider() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useStateProvider must be used within a StateProvider");
  }
  return context;
}
