import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./flip.css";
import { icpToE8s } from "../../scripts/e8s";
import SelectButton from "../Select-button/SelectButton";
import BetSizeSelector from "../BetSizeSelector/BetSizeSelector";
import "./ControlInterface.css";
import { AuthClient } from "@dfinity/auth-client";
import { playSoundEffects } from "../../scripts/SoundEffects";

function ControlInterface({
  isIdentified,
  backendActor,
  callToaster,
  toggleRefresh,
  refreshControl,
  identifiedActor,
  identifiedIcpActor,
  hasPendingControl,
}) {
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  const [selectedSide, setSelectedSide] = useState(-1); // -1 unselected, 0 tails, 1 heads
  const [bidAmount, setBidAmount] = useState(0);
  const [hasPending, setHasPending] = hasPendingControl;

  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });

  const handleChooseSide = (side) => {
    playSoundEffects.click();

    if (!isIdentified) {
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
    if (!isIdentified) {
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
      return;
    }

    if (bidAmount === 0) {
      console.log(`Please select bet size`);
      return;
    }

    setHasPending((prev) => [...prev, "submitFlip"]);

    callToaster(true, `Flipping coin`, `Please wait for result.`, "", 2500);

    const bidSide = selectedSide === 1 ? true : false;
    const result = await backendActor.submitFlip(bidSide, icpToE8s(bidAmount));
    console.log(`result: `, result);

    setHasPending((prev) => prev.filter((item) => item !== "submitFlip"));
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
  };

  return (
    <Container
      fluid
      className="d-flex flex-column justify-content-between align-items-center row-gap-1 control-interface-wrapper"
    >
      <div className="control-interface">
        <BetSizeSelector
          isIdentified={isIdentified}
          betSizeControl={[bidAmount, setBidAmount]}
          callToaster={callToaster}
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
