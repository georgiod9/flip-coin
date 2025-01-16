import { Button, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "../../../../declarations/FlipCoin_backend";
import { e8sToIcp } from "../../scripts/e8s";
import { useState } from "react";
import "./AuthIdentity.css";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { TooltipComponent } from "../Tooltip/Tooltip";
import { TransactionInput } from "../TransactionInput/TransactionInput";
import { WalletComponent } from "../WalletComponent/WalletComponent";
import { TransferModal } from "../TransferModal/TransferModal";
import { transferTokens } from "../../scripts/topUp";
import { playSoundEffects } from "../../scripts/SoundEffects";
import { useIdentity } from "../../context/IdentityContext/IdentityContext";
import { useAccount } from "../../context/AccountContext/AccountContext";
import { useLedger } from "../../context/LedgerContext/LedgerContext";
import { useStateProvider } from "../../context/StateContext/StateContext";
import BackendApi from "../../api/BackendCanister/BackendCanister";

let actor = FlipCoin_backend;

interface AuthIdentityProps {
  callToaster: any;
  toggleRefresh: any;
}

function AuthIdentity({ callToaster, toggleRefresh }: AuthIdentityProps) {
  /** Hooks */
  const { identity, connectWallet, disconnect } = useIdentity();
  const { isLoadingIdentity, isConnected } = useIdentity();
  const {
    credits,
    isRefreshingCreditBalance,
    onChainBalance,
    isRefreshingOnChainBalance,
    refreshCreditBalance,
    resetBalances,
    refreshAll,
  } = useAccount();

  const { ledgerActor } = useLedger();
  const { hasPending, addPendingTask, removePendingTask } = useStateProvider();

  /* State*/

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipMessage, setTooltipMessage] = useState("Copy to clipboard");
  const [showTransferModal, setShowTransferModal] = useState(false);

  /* Functions */
  const connect = async () => {
    addPendingTask("connectWallet");
    await connectWallet();
    removePendingTask("connectWallet");
  };

  const logout = async () => {
    addPendingTask("logout");
    await disconnect();
    resetBalances();
    removePendingTask("logout");
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const copyToClipboard = (e: any, text: any) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setTooltipMessage("Copied!"); // Change message when copied

    // Reset message after a delay
    setTimeout(() => {
      setTooltipMessage("Copy to clipboard");
    }, 1500); // Reset after 1.5 seconds
  };

  const setTooltipCoordinates = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left, // Position relative to the left edge of the viewport
      y: rect.bottom + 5, // 5px below the bottom of the icon
    });
  };

  const handleCopyIconHover = (e: any) => {
    setTooltipMessage("Copy to clipboard");
    setTooltipCoordinates(e);
    setShowTooltip(true);
  };

  const handleOnchainBalanceHover = (e: any) => {
    setTooltipMessage("This is the amount of ICP in your wallet.");
    setTooltipCoordinates(e);
    setShowTooltip(true);
  };

  const handleTopUp = async (amount: any) => {
    try {
      addPendingTask("topUp");

      if (!identity) {
        callToaster(false, `Deposit Failed`, "Identity not found", "", 1500);
        return;
      }

      console.log(`Topping up with ${amount} ICP`);
      callToaster(
        true,
        `Depositing ICP`,
        `Please wait while deposit completes.`,
        "",
        1500
      );
      const response = await transferTokens(
        amount,
        ledgerActor,
        ledgerActor,
        identity
      );
      if (!response?.success) {
        callToaster(false, `Deposit Failed`, response.error, "", 1500);
      } else {
        playSoundEffects.transfer();

        callToaster(
          true,
          `Deposit Success`,
          `Deposited ${amount} ICP.`,
          "",
          1500
        );
      }

      removePendingTask("topUp");
      return;
    } catch (error) {
      callToaster(
        false,
        `Deposit Failed`,
        "An unknown error occurred. Please try again or contact support.",
        "",
        1500
      );
    } finally {
      removePendingTask("topUp");
      refreshAll();
    }
  };

  const handleWithdraw = async (amount: any) => {
    try {
      addPendingTask("withdraw");

      console.log(`Withdrawing ${amount} ICP`);
      callToaster(
        true,
        `Withdrawing ICP`,
        `Please wait while withdrawal completes.`,
        "",
        1500
      );

      const backendApi = await BackendApi.create(identity);
      if (!backendApi) {
        callToaster(
          false,
          `Withdrawal Failed`,
          "Backend API not found",
          "",
          1500
        );
        return;
      }

      const response = await backendApi.withdrawRewards(amount);

      if (!response?.success) {
        callToaster(false, `Withdrawal Failed`, "", response?.error, 1500);
      } else {
        playSoundEffects.transfer();

        callToaster(
          true,
          `Withdrawal Success`,
          `Withdrew ${amount} ICP.`,
          "",
          1500
        );
      }
      removePendingTask("withdraw");
      toggleRefresh();
      return;
    } catch (error) {
      console.error(`Error during withdrawal: `, error);
      callToaster(
        false,
        `Withdrawal Failed`,
        "An unknown error occurred. Please try again or contact support.",
        "",
        1500
      );
    } finally {
      removePendingTask("withdraw");
      refreshAll();
    }
  };

  return (
    <Container style={{ cursor: "pointer", padding: "0" }}>
      {isConnected ? (
        <div style={{ position: "relative" }} onClick={toggleModal}>
          <WalletComponent isModalOpen={isModalOpen} hasPending={hasPending}>
            <div className="wallet-content">
              {!(isRefreshingCreditBalance && credits == 0) ? (
                <Container className="d-flex align-items-center balance-container">
                  <p className="balance-text">
                    {e8sToIcp(credits).toString()} ICP
                  </p>
                </Container>
              ) : (
                <div className="spinner-container">
                  <Spinner className="wallet-spinner" />
                </div>
              )}
              {isModalOpen && (
                <div className="expanded-content">
                  <div className="principal-container">
                    <p>{identity?.getPrincipal().toString()}</p>
                    <div
                      onMouseEnter={(e) => handleCopyIconHover(e)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <ContentCopyIcon
                        className="copy-icon"
                        onClick={(e) =>
                          copyToClipboard(
                            e,
                            identity?.getPrincipal().toString()
                          )
                        }
                      ></ContentCopyIcon>
                      {showTooltip && (
                        <TooltipComponent
                          x={tooltipPosition.x}
                          y={tooltipPosition.y}
                        >
                          {tooltipMessage}
                        </TooltipComponent>
                      )}
                    </div>
                  </div>

                  <div
                    onMouseEnter={(e) => handleOnchainBalanceHover(e)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <p className="balance-info">{`on-chain: ${e8sToIcp(
                      onChainBalance
                    )} ICP`}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <TransactionInput
                      onTopUp={handleTopUp}
                      buttonText="Top Up"
                    />
                    <TransactionInput
                      onTopUp={handleWithdraw}
                      buttonText="Withdraw"
                      maxAmount={Number(e8sToIcp(credits))}
                      isWithdraw={true}
                    />
                  </div>

                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTransferModal(true);
                    }}
                  >
                    Cashout
                  </Button>

                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                    }}
                  >
                    Logout
                  </Button>
                </div>
              )}

              <TransferModal
                show={showTransferModal}
                myPrincipal={identity?.getPrincipal().toText()}
                onHide={() => setShowTransferModal(false)}
                balance={onChainBalance}
                callToaster={callToaster}
                toggleRefresh={toggleRefresh}
              />
            </div>
          </WalletComponent>
        </div>
      ) : (
        <div onClick={connect} style={{ position: "relative" }}>
          <WalletComponent isModalOpen={false} hasPending={hasPending}>
            <div className="wallet-content justify-center">
              <p className="connect-text">Connect</p>
            </div>
          </WalletComponent>
        </div>
      )}
    </Container>
  );
}

export default AuthIdentity;
