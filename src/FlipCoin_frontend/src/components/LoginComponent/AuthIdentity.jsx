import { Container, Spinner } from "react-bootstrap";
import walletButton from "../../assets/svg/connect_wallet.svg";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
import { getLedgerCanisterPrincipal } from "../../scripts/getPrincipal";
import { setupIdentifiedIcpLedger } from "../../scripts/icpLedger";
import { e8sToIcp } from "../../scripts/e8s";

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
  const connectWalletTextStyle = {
    whiteSpace: "nowrap",
    fontSize: "clamp(18px,1.5vw,24px)",
    margin: "0",
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

      // Start the login process and wait for it to finish
      await new Promise((resolve, reject) => {
        //safari: http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943/
        //http://bw4dl-smaaa-aaaaa-qaacq-cai.127.0.0.1:4943/
        //
        authClient.login({
          //
          identityProvider: `http://bw4dl-smaaa-aaaaa-qaacq-cai.localhost:4943/`,
          onSuccess: resolve,
          onError: reject,
        });
      });
      console.log(`Logged in!`);

      console.log(`Getting identity..`);
      const identity = authClient.getIdentity();
      console.log(`logged in with identity:`, identity);

      // Using the identity obtained from the auth client, create an agent to interact with the IC.
      const agent = new HttpAgent({
        identity,
        host: `http://localhost:4943`,
      });
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

      // const credits = await getFlipCoinCredits(actor);

      // setAccountCredit(credits);

      console.log(`Created new actor from identified agent.`);
    } catch (error) {
      console.error("Error during wallet connection:", error);
    }

    return false;
  };

  return (
    <Container style={{ cursor: "pointer" }}>
      {isWalletConnected ? (
        <div style={{ position: "relative" }}>
          <img src={walletButton}></img>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "35%",
              transform: "translate(-50%,-50%)",
            }}
          >
            {accountBalance === 0 || accountBalance ? (
              <Container className="d-flex flex-column justify-content-center align-items-start">
                <p style={balanceTextStyle}>
                  {e8sToIcp(accountBalance).toString()} ICP
                </p>
                <p style={balanceTextStyle}>
                  Fees: {e8sToIcp(accountCredit).toString()} ICP
                </p>
              </Container>
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      ) : (
        <div onClick={connectWallet} style={{ position: "relative" }}>
          <img src={walletButton}></img>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "40%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <p style={connectWalletTextStyle}>Connect wallet</p>
          </div>
        </div>
      )}
    </Container>
  );
}

export default AuthIdentity;
