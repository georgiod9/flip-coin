import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./flip.css";
import { icpToE8s } from "../../scripts/e8s";
// import SelectButton from "../Select-button/SelectButton";
// import BetSizeSelector from "../BetSizeSelector/BetSizeSelector";
import "./ControlInterface.css";
import { AuthClient } from "@dfinity/auth-client";
import { playSoundEffects } from "../../scripts/SoundEffects";
import { useIdentity } from "../../context/IdentityContext/IdentityContext";
import BackendApi from "../../api/BackendCanister/BackendCanister";
import { useStateProvider } from "../../context/StateContext/StateContext";
import { useBackend } from "../../context/BackendContext/BackendContext";
import BetSizeSelector from "../BetSizeSelector/BetSizeSelector";
import SelectButton from "../Select-button/SelectButton";
import { useAccount } from "../../context/AccountContext/AccountContext";

interface ControlInterfaceProps {
  backendActor: any;
  callToaster: any;
  toggleRefresh: any;
}
function ControlInterface({
  backendActor,
  callToaster,
  toggleRefresh,
}: ControlInterfaceProps) {
  /** Hooks */
  const { isConnected, identity } = useIdentity();
  const { addPendingTask, removePendingTask } = useStateProvider();
  const { refreshAllBalances } = useBackend();
  const { refreshCreditBalance } = useAccount();

  /** States */
  const [selectedSide, setSelectedSide] = useState(-1); // -1 unselected, 0 tails, 1 heads
  const [bidAmount, setBidAmount] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });

  const handleChooseSide = (side: string) => {
    playSoundEffects.click();

    if (!isConnected) {
      callToaster(false, `Failed`, `Please connect your wallet`, "", 2000);
      return;
    }

    if (side === "heads") {
      setSelectedSide(1);
    } else if (side === "tails") {
      setSelectedSide(0);
    }

    callToaster(
      true,
      `Side Chosen`,
      `You chose ${side.toUpperCase()}`,
      "",
      2000
    );
  };

  const handleSubmitFlip = async () => {
    playSoundEffects.click();

    const authClient = await AuthClient.create();
    const id = authClient.getIdentity();
    console.log(`Using identity:`, id.getPrincipal().toString());
    if (!isConnected) {
      callToaster(false, `Failed`, `Please connect your wallet`, "", 2000);
      return;
    }

    // Validate backend service instance
    if (!backendActor) {
      console.log(`Backend instance not defined.`);
      return;
    }
    if (selectedSide === -1) {
      console.log(`Please select side.`);
      callToaster(false, `Failed`, `Please select side.`, "", 2000);
      return;
    }

    if (bidAmount === 0) {
      callToaster(false, `Failed`, `Please select bet size`, "", 2000);
      return;
    }

    try {
      addPendingTask("submitFlip");
      callToaster(true, `Flipping coin`, `Please wait for result.`, "", 2500);
      setIsFlipping(true);

      const bidSide = selectedSide === 1 ? true : false;
      const backendApi = await BackendApi.create(identity);
      if (!backendApi) {
        callToaster(false, `Failed`, `Failed to create backend API.`, "", 2000);
        return;
      }

      const result = await backendApi.submitFlip(bidSide, bidAmount);
      setIsFlipping(false);

      console.log(`Flipped: `, result);
      toggleRefresh();

      if (result.includes("Congratulations")) {
        playSoundEffects.betWin();
      } else {
        playSoundEffects.betLose();
      }

      // TODO: Calculate reward based on actual multiplier from canister
      callToaster(
        result.includes("Congratulations") ? true : false,
        result.includes("Congratulations")
          ? `You won ${bidAmount * 1.95} ICP`
          : `You lost.`,
        `${result}`,
        "",
        6000
      );

      setBidAmount(0);
      setSelectedSide(-1);
    } catch (error) {
      console.log(`Error submitting flip: `, error);
      callToaster(false, `Failed`, `Failed to submit flip.`, "", 2000);
    } finally {
      removePendingTask("submitFlip");
      console.log(`Refreshing balances...`);
      refreshAllBalances();
      refreshCreditBalance();
    }
  };

  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-between align-items-center row-gap-1 control-interface-wrapper"
    >
      <div className="control-interface">
        <BetSizeSelector
          isIdentified={isConnected}
          betSizeControl={[bidAmount, setBidAmount]}
          callToaster={callToaster}
          isLoading={isFlipping}
        />

        <div className="buttons-container">
          <div className="choice-buttons">
            <SelectButton
              text={"HEADS"}
              onClick={() => handleChooseSide("heads")}
              type={"select-side"}
            />
            <SelectButton
              text={"TAILS"}
              onClick={() => handleChooseSide("tails")}
              type={"select-side"}
            />
          </div>
          <SelectButton
            text={"FLIP"}
            onClick={() => handleSubmitFlip()}
            type={"submit-flip"}
          />
        </div>
      </div>
    </Container>
  );
}

export default ControlInterface;
