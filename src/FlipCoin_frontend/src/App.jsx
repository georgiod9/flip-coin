import { useEffect, useState } from "react";
import { FlipCoin_backend, createActor } from "declarations/FlipCoin_backend";
import Header from "./components/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlInterface from "./components/control/ControlInterface";
import Spacer from "./components/Spacer";
import Toaster from "./components/Toast/Toaster";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { TopUpComponent } from "./components/TopUp/TopUpComponent";

let actor = FlipCoin_backend;

function App() {
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [walletIdentity, setWalletIdentity] = useState(null);
  const [identifiedActor, setIdentifiedActor] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

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
    console.log(`test`);
  }, []);
  useEffect(() => {
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
        const agent = new HttpAgent({ identity });
        // Using the interface description of our webapp, create an actor that we use to call the service methods.
        actor = createActor(process.env.CANISTER_ID_FLIPCOIN_BACKEND, {
          agent,
        });

        setWalletIdentity(identity);
        setIdentifiedActor(actor);

        console.log(`Created new actor from identified agent.`);
      } catch (error) {
        console.error("Error during wallet connection:", error);
      }

      return false;
    };

    connectWallet();
  }, []);

  return (
    <div>
      {showTopUpModal && (
        <TopUpComponent showControl={[showTopUpModal, setShowTopUpModal]} />
      )}
      <Header
        refreshControl={[triggerRefresh, setTriggerRefresh]}
        setShowTopUpModal={setShowTopUpModal}
      />
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

      <div>
        <ControlInterface
          backendActor={actor}
          callToaster={callToaster}
          toggleRefresh={toggleRefresh}
          refreshControl={[triggerRefresh, setTriggerRefresh]}
        />
      </div>
    </div>
  );
}

export default App;
