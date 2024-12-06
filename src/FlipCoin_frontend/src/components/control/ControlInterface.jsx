import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./flip.css";
import { icpToE8s } from "../../scripts/e8s";
import SelectButton from "../Select-button/SelectButton";
import BetSizeSelector from "../BetSizeSelector/BetSizeSelector";
import "./ControlInterface.css";

function ControlInterface({
  isIdentified,
  backendActor,
  callToaster,
  toggleRefresh,
  refreshControl,
  identifiedActor,
  identifiedIcpActor,
}) {
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  const [selectedSide, setSelectedSide] = useState(-1); // -1 unselected, 0 tails, 1 heads
  const [bidAmount, setBidAmount] = useState(0);

  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });
  const containerBorder = {
    width: window.innerWidth < 450 ? "80vw" : "100vw",
    height: "auto",
    margin: "auto auto",
    padding: "10px 10px",
  };

  const buttonsContainerStyle = {
    width: window.innerWidth < 450 ? "70vw" : "25vw",
    height: "auto",
    padding: "10px 10px",
  };

  const handleChooseSide = (side) => {
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

    callToaster(true, `Flipping coin`, `Please wait for result.`, "", 2500);

    const bidSide = selectedSide === 1 ? true : false;
    const result = await backendActor.submitFlip(bidSide, icpToE8s(bidAmount));
    console.log(`result: `, result);

    toggleRefresh();

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
      style={containerBorder}
      className="d-flex flex-column justify-content-between align-items-center row-gap-1 control-interface-wrapper"
    >
      <div className="control-interface">
        <BetSizeSelector
          isIdentified={isIdentified}
          betSizeControl={[bidAmount, setBidAmount]}
          callToaster={callToaster}
        />

        <Container style={buttonsContainerStyle}>
          <Row>
            <Col style={{ padding: "5px 5px" }} xs={6} md={6}>
              <SelectButton
                text={"HEADS"}
                onClick={() => handleChooseSide("heads")}
                type={"select-side"}
              />
            </Col>

            <Col style={{ padding: "5px 5px" }} xs={6} md={6}>
              <SelectButton
                text={"TAILS"}
                onClick={() => handleChooseSide("tails")}
                type={"select-side"}
              />
            </Col>
          </Row>

          <Row>
            <Col style={{ padding: "5px 5px" }}>
              <SelectButton
                text={"FLIP"}
                onClick={() => handleSubmitFlip()}
                type={"submit-flip"}
              />
            </Col>
          </Row>
        </Container>
      </div>
    </Container>
  );
}

export default ControlInterface;
