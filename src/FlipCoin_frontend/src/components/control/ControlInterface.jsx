import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import Spacer from "../Spacer";
// import coinIcon from "../../assets/coin.png";
import coinIcon from "../../assets/svg/coin.svg";
import "./flip.css";
import { depositTokens } from "../../scripts/topUp";
import { e8sToIcp, icpToE8s } from "../../scripts/e8s";
import { getUserDepositAddress } from "../../scripts/getPrincipal";
import { retrieveTransferFee } from "../../scripts/fee";
import SelectButton from "../Select-button/SelectButton";
import BetSizeSelector from "../BetSizeSelector/BetSizeSelector";

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

  const betButtonsColumnStyle = {
    padding: "3px 3px",
  };

  const buttonStyle = {
    backgroundColor: "#F26430",
    border: "1px solid #F26430",
    borderRadius: "5px",
    width: "100%",
    height: "40px",
    opacity: "1",
    padding: "0",
  };

  const headsButtonStyle = {
    width: "100%",
    height: "60px",
    borderRadius: "5px",
    backgroundColor: "#6761A8",
    border: "1px solid #6761A8",
    whiteSpace: "nowrap",
  };

  const tailsButtonStyle = {
    width: "100%",
    height: "60px",
    borderRadius: "5px",
    backgroundColor: "#009B72",
    border: "1px solid #009B72",
    padding: "1px 1px",
    whiteSpace: "nowrap",
  };

  const flipButtonStyle = {
    backgroundColor: "#009DDC",
    border: "1px solid #009DDC",
    borderRadius: "5px",
    width: "100%",
    height: "40px",
  };

  const coinIconStyle = {
    width: "30%",
    height: "30%",
  };

  const betAmounts = [0.1, 0.5, 1, 1.5, 2, 5];

  const handleChooseSide = (side) => {
    if (!isIdentified) {
      callToaster(false, `Failed`, `Please connect your wallet`, 2000);
      return;
    }

    if (side === "heads") {
      setSelectedSide(1);
    } else if (side === "tails") {
      setSelectedSide(0);
    }

    callToaster(true, `Side Chosen`, `You chose ${side.toUpperCase()}`, 2000);
  };

  const handleChooseBetSize = (amount) => {
    setBidAmount(amount);
    callToaster(true, `Bid Placed`, `You're bidding ${amount} ICP.`, 2000);
  };

  const topUp = async (amount) => {
    const amountInE8s = icpToE8s(
      parseFloat(amount + e8sToIcp(retrieveTransferFee()))
    );

    console.log(`Amount in e8s`, amountInE8s);
    try {
      // Retrieve deposit address
      const userDepositAddress = await getUserDepositAddress(identifiedActor);

      console.log(`userDepositAddress`, userDepositAddress);

      const transferArgs = {
        to: userDepositAddress,
        from_subaccount: [],
        created_at_time: [],
        memo: BigInt(0x1),
        amount: { e8s: BigInt(Number(amountInE8s) + retrieveTransferFee()) },
        fee: { e8s: retrieveTransferFee() },
      };
      console.log(`transferArgs`, transferArgs);

      const result = await identifiedIcpActor.transfer(transferArgs);
      console.log("Transfer token result:", result);
      console.log("Transfer token result.ok:", result.Ok);

      const isDeposited = await triggerDepositTokens(bidAmount);
      console.log(`Is Deposited`, isDeposited);
      if (!isDeposited) {
        console.error(`Failed to deposit tokens`);
        callToaster(
          false,
          `Deposit Failed`,
          `Failed to deposit ${e8sToIcp(amount)}.`,
          1500
        );

        return false;
      } else {
        console.log(`call deposit success...$$$$$`);
        callToaster(
          true,
          `Deposit Success`,
          `Deposited ${e8sToIcp(amount)}.`,
          1500
        );
      }
      console.log(`Deposit complete.`);

      // setShow(false);

      // Refresh components
      // toggleRefresh();
      return true;
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  };

  const triggerDepositTokens = async (bidAmount) => {
    try {
      if (!identifiedActor) {
        throw new Error("Backend actor not identified.");
      }
      const deposit = await depositTokens(identifiedActor);
      console.log(`deposit:`, deposit);
      console.log(`deposit.Ok:`, deposit.Ok);

      if (deposit && deposit.Ok >= bidAmount) {
        return true;
      }

      return false;
    } catch (error) {
      return null;
    }
  };

  const handleSubmitFlip = async () => {
    if (!isIdentified) {
      callToaster(false, `Failed`, `Please connect your wallet`, 2000);
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

    // let bidAmountIcp = bidAmount * 10 ** 8;

    callToaster(
      true,
      `Depositing ICP`,
      `Please wait while deposit completes.`,
      1500
    );

    const isTopped = await topUp(bidAmount);
    if (!isTopped) {
      callToaster(false, `Flip Failed`, `ICP deposit failed.`, 1500);
      return;
    }

    callToaster(
      true,
      `Flipping coin`,
      `Deposit success. Please wait for result.`,
      2500
    );

    console.log(`Flipping coin...`);
    const bidSide = selectedSide === 1 ? true : false;
    const result = await backendActor.submitFlip(bidSide, icpToE8s(bidAmount));
    console.log(`result: `, result);

    toggleRefresh();
    console.log(`calling toaster`);
    callToaster(
      result.includes("Congratulations") ? true : false,
      result.includes("Congratulations")
        ? `You won ${bidAmount * 1.95} ICP`
        : `You lost.`,
      `${result}`,
      6000
    );

    setBidAmount(0);
    setSelectedSide(-1);
  };

  return (
    <Container
      fluid
      style={containerBorder}
      className="d-flex flex-column justify-content-between align-items-center row-gap-1"
    >
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
      {/* </Card.Body> */}
      {/* </Card> */}
    </Container>
  );
}

export default ControlInterface;
