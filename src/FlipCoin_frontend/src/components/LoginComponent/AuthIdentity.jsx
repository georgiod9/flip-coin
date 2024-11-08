import { Container, Spinner } from "react-bootstrap";
import walletButton from "../../assets/svg/connect_wallet.svg";
import { AuthClient, LocalStorage } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
import { getLedgerCanisterPrincipal } from "../../scripts/getPrincipal";
import {
  setupIdentifiedBackendActor,
  setupIdentifiedIcpLedger,
} from "../../scripts/icpLedger";
import { e8sToIcp } from "../../scripts/e8s";
import { useEffect } from "react";
import { config } from "../../config/config";

let actor = FlipCoin_backend;

function AuthIdentity({
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
  const walletButtonStyle = {
    width: "clamp(200px,15vw,450px)",
  };
  const connectWalletTextStyle = {
    whiteSpace: "nowrap",
    fontSize: "clamp(16px,1.5vw,24px)",
    margin: "0",
    padding: "0",
  };

  const balanceTextStyle = {
    whiteSpace: "nowrap",
    fontSize: "clamp(12px,1.5vw,20px)",
    margin: "0",
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
        <div style={{ position: "relative" }}>
          <img
            className="wallet-button-sizing"
            // style={walletButtonStyle}
            src={walletButton}
          ></img>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "35%",
              transform: "translate(-50%,-50%)",
            }}
          >
            {accountBalance !== null && isWalletConnected ? (
              <Container className="d-flex flex-column justify-content-center align-items-start">
                <p style={balanceTextStyle}>
                  {e8sToIcp(accountBalance).toString()} $ICP
                </p>
                {/* <p style={balanceTextStyle}>
                  Fees: {e8sToIcp(accountCredit).toString()} ICP
                </p> */}
              </Container>
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      ) : (
        <div onClick={connectWallet} style={{ position: "relative" }}>
          <img
            className="wallet-button-sizing"
            // style={walletButtonStyle}
            src={walletButton}
          ></img>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "40%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <p style={connectWalletTextStyle}>Connect</p>
          </div>
        </div>
      )}
    </Container>
  );
}

export default AuthIdentity;
