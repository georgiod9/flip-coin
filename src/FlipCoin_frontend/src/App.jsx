import { useState } from "react";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import Header from "./components/header/header";
import "bootstrap/dist/css/bootstrap.min.css";
import ControlInterface from "./components/control/ControlInterface";
import Spacer from "./components/Spacer";
import Toaster from "./components/Toast/Toaster";

function App() {
  const [triggerRefresh, setTriggerRefresh] = useState(false);

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

  return (
    <div>
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
        <Header refreshControl={[triggerRefresh, setTriggerRefresh]} />
      </div>
      <div>
        <ControlInterface
          callToaster={callToaster}
          toggleRefresh={toggleRefresh}
          refreshControl={[triggerRefresh, setTriggerRefresh]}
        />
      </div>
    </div>
  );
}

export default App;
