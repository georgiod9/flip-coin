import { useEffect } from "react";
import "./WalletComponent.css";

interface WalletComponentProps {
  isModalOpen: boolean;
  children: React.ReactNode;
  hasPending: string[];
  isLoading?: boolean;
}

export const WalletComponent = ({
  isModalOpen,
  children,
  hasPending,
  isLoading = false,
}: WalletComponentProps) => {
  return (
    <div className="wallet-button-wrapper">
      <div className={`wallet-button ${isModalOpen ? "expanded" : ""}`}>
        <div className="wallet-button-inner">
          <div className="wallet-icon"></div>
          <div
            className={`wallet-icon-glow ${
              hasPending?.length > 0 ? "active" : ""
            }`}
          ></div>
          {children}
        </div>
      </div>
    </div>
  );
};
