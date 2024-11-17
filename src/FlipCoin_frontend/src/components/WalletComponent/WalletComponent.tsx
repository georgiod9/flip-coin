import "./WalletComponent.css";

export const WalletComponent = ({
  isModalOpen,
  children,
}: {
  isModalOpen: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div className="wallet-button-wrapper">
      <div className={`wallet-button ${isModalOpen ? "expanded" : ""}`}>
        <div className="wallet-button-inner">
          <div className="wallet-icon">
            <div className="wallet-top"></div>
            <div className="wallet-body"></div>
            <div className="wallet-money"></div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
