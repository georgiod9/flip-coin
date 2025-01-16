import { useEffect, useState } from "react";
import { FlipCoin_backend } from "../../declarations/FlipCoin_backend";
import Header from "./components/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlInterface from "./components/control/ControlInterface";

import { getHouseStatistics } from "./scripts/getHouse";
import { useIdentity } from "./context/IdentityContext/IdentityContext";
import { useAccount } from "./context/AccountContext/AccountContext";
import { useLedger } from "./context/LedgerContext/LedgerContext";
import { useStateProvider } from "./context/StateContext/StateContext";
import Toaster from "./components/Toast/Toaster";

let actor = FlipCoin_backend;
let backendPrincipal = process.env.CANISTER_ID_FLIPCOIN_BACKEND;

function App() {
  /** Hooks */
  const { identity } = useIdentity();
  const { credits } = useAccount();
  const { isTransferring } = useLedger();
  const { addPendingTask, removePendingTask } = useStateProvider();

  /** States */
  /** States */
  const [backendActor, setBackendActor] = useState(FlipCoin_backend);
  const [triggerRefresh, setTriggerRefresh] = useState(false);

  const [identifiedActor, setIdentifiedActor] = useState(null);

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
  const callToaster = (
    status: boolean,
    header: string,
    data: string,
    link: string,
    timeout: number
  ) => {
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
    const getBalances = async () => {
      if (identity) {
        const principal = identity.getPrincipal();
        console.log(`Logged in with principal:`, principal.toText());
      }
    };
    getBalances();
  }, [triggerRefresh, identity]);

  return (
    <div className="main-background">
      <Header callToaster={callToaster} toggleRefresh={toggleRefresh} />
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
        }}
      >
        <ControlInterface
          backendActor={backendActor}
          callToaster={callToaster}
          toggleRefresh={toggleRefresh}
        />
      </div>
    </div>
  );
}

export default App;
