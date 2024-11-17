import { Button, Container, Spinner } from "react-bootstrap";
import { AuthClient, LocalStorage } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
import { getLedgerCanisterPrincipal } from "../../scripts/getPrincipal";
import {
  setupIdentifiedBackendActor,
  setupIdentifiedIcpLedger,
} from "../../scripts/icpLedger";
import { e8sToIcp } from "../../scripts/e8s";
import { useEffect, useState } from "react";
import { config } from "../../config/config";
import "./AuthIdentity.css";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { TooltipComponent } from "../Tooltip/Tooltip";
import { TopUpComponent } from "../TopUp/TopUp";
import { WalletComponent } from "../WalletComponent/WalletComponent";

let actor = FlipCoin_backend;

function AuthIdentity({
  walletIdentity,
  isWalletConnected,
  setWalletIdentity,
  setIdentifiedIcpLedgerActor,
  setIsIdentified,
  setIdentifiedActor,
  setLedgerCanisterPrincipal,
  setBackendActor,
  accountBalance,
  accountCredit,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipMessage, setTooltipMessage] = useState("Copy to clipboard");

  const connectWalletTextStyle = {
    whiteSpace: "nowrap",
    fontSize: "clamp(16px,1.5vw,24px)",
    margin: "0",
    padding: "0",
  };

  const connectWallet = async () => {
    console.log(`Connecting wallet...`);

    try {
      // Create an auth client
      let authClient = await AuthClient.create();
      console.log(`Auth client init`, authClient);

      await new Promise((resolve, reject) => {
        //safari: http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943/
        //http://bw4dl-smaaa-aaaaa-qaacq-cai.127.0.0.1:4943/
        //
        authClient.login({
          //
          identityProvider: config.identityProvider,
          maxTimeToLive: BigInt(
            config.loginExpiry * 24 * 60 * 60 * 1000 * 1000 * 1000
          ),
          onSuccess: resolve,
          onError: reject,
        });
      });

      const identity = authClient.getIdentity();
      console.log(`logged in with identity:`, identity);

      // Using the identity obtained from the auth client, create an agent to interact with the IC.
      const agent = await HttpAgent.create({
        identity,
        host: `http://localhost:4943`,
      });

      await agent.fetchRootKey();

      // Using the interface description of our webapp, create an actor that we use to call the service methods.
      actor = createActor(process.env.CANISTER_ID_FLIPCOIN_BACKEND, {
        agent,
      });
      setBackendActor(actor);

      const ledgerPrincipal = await getLedgerCanisterPrincipal();
      console.log(`ledger prinicapl id`, ledgerPrincipal.toText());

      setLedgerCanisterPrincipal(ledgerPrincipal.toText());

      const icpLedgerActor = setupIdentifiedIcpLedger(agent);

      setIdentifiedIcpLedgerActor(icpLedgerActor);
      setWalletIdentity(identity);
      setIsIdentified(true);
      setIdentifiedActor(actor);

      console.log(`Created new actor from identified agent.`);
    } catch (error) {
      console.error("Error during wallet connection:", error);
    }

    return false;
  };

  const logout = async () => {
    console.log(`<<LOGGING OUT>>`);
    const authClient = await AuthClient.create();
    await authClient.logout();
    setIsIdentified(false);
    setWalletIdentity(null);
    setIdentifiedActor(null);
    setIdentifiedIcpLedgerActor(null);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    console.log(`Modal is ${isModalOpen ? "open" : "closed"}`);
  };

  const copyToClipboard = (e, text) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setTooltipMessage("Copied!"); // Change message when copied

    // Optional: Reset message after a delay
    setTimeout(() => {
      setTooltipMessage("Copy to clipboard");
    }, 1500); // Reset after 1.5 seconds
  };

  const handleCopyIconHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left, // Position relative to the left edge of the viewport
      y: rect.bottom + 5, // 5px below the bottom of the icon
    });
    setShowTooltip(true);
    console.log("Tooltip position:", rect.left, rect.bottom); // Debug log
  };

  const handleTopUp = async (amount) => {
    console.log(`Topping up with ${amount} ICP`);
    // Add your top-up logic here
  };

  useEffect(() => {
    const checkAuth = async () => {
      let authClient = await AuthClient.create();
      if (authClient.isAuthenticated()) {
        console.log(`Identity already authorized. Rehydrating...`);
        const identity = authClient.getIdentity();

        if (
          identity.getPrincipal().toString().includes(config.loggedOutPrincipal)
        ) {
          await logout();
          return;
        }

        console.log(`Identity....`, identity);
        const agent = await HttpAgent.create({
          identity,
          host: `http://localhost:4943`,
        });

        await agent.fetchRootKey();

        const identifiedActor = setupIdentifiedBackendActor(agent);
        actor = identifiedActor;
        setIdentifiedActor(identifiedActor);
        setIsIdentified(true);
        setWalletIdentity(identity);
        setBackendActor(identifiedActor);
        const icpLedgerActor = setupIdentifiedIcpLedger(agent);
        setIdentifiedIcpLedgerActor(icpLedgerActor);
        const ledgerPrincipal = await getLedgerCanisterPrincipal();
        console.log(`ledger prinicapl id rehydrate`, ledgerPrincipal.toText());

        setLedgerCanisterPrincipal(ledgerPrincipal.toText());
        console.log(`Done rehydrating identity.`);
      } else {
        await logout();
        return;
      }
    };
    checkAuth();
  }, []);

  return (
    <Container style={{ cursor: "pointer" }}>
      {isWalletConnected ? (
        <div style={{ position: "relative" }} onClick={toggleModal}>
          <WalletComponent isModalOpen={isModalOpen}>
            <div className="wallet-content">
              {accountBalance !== null && isWalletConnected ? (
                <Container className="d-flex align-items-center balance-container">
                  <p className="balance-text">
                    {e8sToIcp(accountBalance).toString()} ICP
                  </p>
                </Container>
              ) : (
                <Spinner />
              )}
              {isModalOpen && (
                <div className="expanded-content">
                  <div className="principal-container">
                    <p>{walletIdentity.getPrincipal().toString()}</p>
                    <div
                      onMouseEnter={(e) => {
                        console.log(`Mouse entered`);
                        handleCopyIconHover(e);
                      }}
                      onMouseLeave={() => {
                        console.log(`Mouse left`);
                        setShowTooltip(false);
                      }}
                    >
                      <ContentCopyIcon
                        className="copy-icon"
                        onClick={(e) =>
                          copyToClipboard(
                            e,
                            walletIdentity.getPrincipal().toString()
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

                  <TopUpComponent onTopUp={handleTopUp} />

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
            </div>
          </WalletComponent>
        </div>
      ) : (
        <div onClick={connectWallet} style={{ position: "relative" }}>
          <WalletComponent isModalOpen={false}>
            <div className="wallet-content">
              <p className="connect-text">Connect</p>
            </div>
          </WalletComponent>
        </div>
      )}
    </Container>
  );
}

export default AuthIdentity;
