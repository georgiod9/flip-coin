import { useEffect, useState } from "react";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
// import { icp_ledger_canister } from "declarations/icp_ledger_canister";
import Header from "./components/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlInterface from "./components/control/ControlInterface";
import Spacer from "./components/Spacer";
import Toaster from "./components/Toast/Toaster";
// import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { TopUpComponent } from "./components/TopUp/TopUpComponent";
import {
  getFlipCoinCanisterBalance,
  getFlipCoinCredits,
  getWalletOnChainBalance,
} from "./scripts/getBalance";
import { getLedgerCanisterPrincipal } from "./scripts/getPrincipal";
import { setupIdentifiedIcpLedger } from "./scripts/icpLedger";

let actor = FlipCoin_backend;
let backendPrincipal = process.env.CANISTER_ID_FLIPCOIN_BACKEND;

function App() {
  const [backendActor, setBackendActor] = useState(FlipCoin_backend);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [walletIdentity, setWalletIdentity] = useState(null);
  const [identifiedActor, setIdentifiedActor] = useState(null);
  const [identifiedIcpLedgerActor, setIdentifiedIcpLedgerActor] =
    useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [accountCredit, setAccountCredit] = useState(0);
  const [isIdentified, setIsIdentified] = useState(false);

  const [flipCoinCanisterBalance, setFlipCoinCanisterBalance] = useState(0);
  const [ledgerCanisterPrincipal, setLedgerCanisterPrincipal] = useState(null);

  //Toast vars
  const [toastProps, setToastProps] = useState({
    toastType: true,
    toastHeader: "",
    toastData: "",
    textColor: "#50FF97",
    timeout: 5000,
    link: "",
  });
  const [showToaster, setShowToaster] = useState(false);

  //Manage toast
  const callToaster = (status, header, data, link, timeout) => {
    let fontColor = "#50FF97"; //default green color
    if (status) {
      fontColor = "#50FF97";
    } else {
      fontColor = "#FF3131";
    }
    setToastProps({
      toastType: status,
      toastHeader: header,
      toastData: data,
      textColor: fontColor,
      timeout: timeout,
      link: link,
    });
    setShowToaster(true);
  };
  //Reset toast data after hiding
  const handleToastHide = () => {
    const currentProps = toastProps;
    setShowToaster(false);
  };

  const toggleRefresh = () => {
    setTriggerRefresh((prev) => !prev);
  };

  useEffect(() => {
    console.log(`Backend principal`, backendPrincipal);
  }, []);

  useEffect(() => {
    const getBalances = async () => {
      const contractBalance = await getFlipCoinCanisterBalance(
        backendPrincipal
      );
      console.log(`Contract balance:`, contractBalance);
      setFlipCoinCanisterBalance(contractBalance);

      if (walletIdentity && identifiedActor && ledgerCanisterPrincipal) {
        const principal = walletIdentity.getPrincipal();
        console.log(`Logged in with principal:`, principal.toText());

        const balance = await getWalletOnChainBalance(principal);
        setWalletBalance(balance);

        const credits = await getFlipCoinCredits(identifiedActor);
        setAccountCredit(credits);
      }
    };
    getBalances();
  }, [
    triggerRefresh,
    walletIdentity,
    identifiedActor,
    ledgerCanisterPrincipal,
  ]);

  return (
    <div className="main-background">
      {showTopUpModal && (
        <TopUpComponent
          refreshControl={[triggerRefresh, toggleRefresh]}
          showControl={[showTopUpModal, setShowTopUpModal]}
          accountBalance={walletBalance}
          accountCredit={accountCredit}
          ledgerPrincipal={ledgerCanisterPrincipal}
          identifiedActor={identifiedActor}
          identifiedIcpActor={identifiedIcpLedgerActor}
        />
      )}
      <Header
        refreshControl={[triggerRefresh, toggleRefresh]}
        setShowTopUpModal={setShowTopUpModal}
        accountBalance={walletBalance}
        accountCredit={accountCredit}
        isWalletConnected={isIdentified}
        flipCoinCanisterBalance={flipCoinCanisterBalance}
        setWalletIdentity={setWalletIdentity}
        setIdentifiedIcpLedgerActor={setIdentifiedIcpLedgerActor}
        setIsIdentified={setIsIdentified}
        setIdentifiedActor={setIdentifiedActor}
        setLedgerCanisterPrincipal={setLedgerCanisterPrincipal}
        setBackendActor={setBackendActor}
      />
      <Spacer space={"15"} unit={"vh"} />
      {showToaster && (
        <Toaster
          headerContent={toastProps.toastHeader}
          toastStatus={toastProps.toastType}
          toastData={toastProps.toastData}
          timeout={toastProps.timeout}
          link={toastProps.link}
          show={showToaster}
          onHide={handleToastHide}
        />
      )}

      <div
        style={{
          maxWidth: "100vw",
          // maxWidth: "100vw",
          // positon: "absolute",
          // top: "50",
          // left: "50",
          // transform: "translate(-50%,-50%)",
        }}
      >
        <ControlInterface
          isIdentified={isIdentified}
          backendActor={backendActor}
          callToaster={callToaster}
          toggleRefresh={toggleRefresh}
          identifiedActor={identifiedActor}
          identifiedIcpActor={identifiedIcpLedgerActor}
          refreshControl={[triggerRefresh, setTriggerRefresh]}
        />
      </div>
    </div>
  );
}

export default App;
