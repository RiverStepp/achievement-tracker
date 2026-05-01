import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ExclusiveHoverCardContextValue = {
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
};

const ExclusiveHoverCardContext = createContext<ExclusiveHoverCardContextValue | null>(
  null
);

export function ExclusiveHoverCardScope({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const setActiveKeyStable = useCallback((key: string | null) => {
    setActiveKey(key);
  }, []);

  const value = useMemo(
    (): ExclusiveHoverCardContextValue => ({
      activeKey,
      setActiveKey: setActiveKeyStable,
    }),
    [activeKey, setActiveKeyStable]
  );

  return (
    <ExclusiveHoverCardContext.Provider value={value}>{children}</ExclusiveHoverCardContext.Provider>
  );
}

export function useExclusiveHoverCardGroup() {
  return useContext(ExclusiveHoverCardContext);
}
