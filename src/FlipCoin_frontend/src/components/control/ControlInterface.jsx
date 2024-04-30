import { useEffect, useState } from "react";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import Spacer from "../Spacer";
import coinIcon from "../../assets/coin.png";
import "./flip.css";

function ControlInterface({ callToaster, toggleRefresh, refreshControl }) {
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  console.log(`stared`);
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
    width: window.innerWidth < 450 ? "80vw" : "50vw",
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

  const handleSubmitFlip = async () => {
    if (selectedSide === -1) {
      console.log(`Please select side.`);
      return;
    }

    if (bidAmount === 0) {
      console.log(`Please select bet size`);
      return;
    }

    callToaster(true, `Flipping coin`, `Please wait for result.`, 1500);

    console.log(`Flipping coin...`);
    let bidAmountIcp = bidAmount * 10 ** 8;
    const bidSide = selectedSide === 1 ? true : false;
    const result = await FlipCoin_backend.submitFlip(bidSide, bidAmountIcp);
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
      <img
        className="coin-flip-animation"
        style={coinIconStyle}
        src={coinIcon}
      ></img>

      {/* <Card style={{ ...cardContainerStyle, ...cardStyleUI }}> */}
      {/* <Card.Body> */}
      <Container style={buttonsContainerStyle}>
        <Row>
          <Col style={{ padding: "2px 2px" }} xs={6} md={6}>
            <Button
              style={headsButtonStyle}
              onClick={() => handleChooseSide("heads")}
            >
              HEADS
            </Button>
          </Col>

          <Col style={{ padding: "2px 2px" }} xs={6} md={6}>
            <Button
              style={tailsButtonStyle}
              onClick={() => handleChooseSide("tails")}
            >
              TAILS
            </Button>
          </Col>
        </Row>

        <Spacer space={5} />
        <Row className="justify-content-center">
          {" "}
          {/* Center content in the row */}
          {betAmounts.map((amount, index) => (
            <Col
              style={betButtonsColumnStyle}
              key={index}
              xs={6}
              md={4}
              className="d-flex justify-content-center mb-1"
            >
              {" "}
              {/* Center each button in a column */}
              <Button
                onClick={() => handleChooseBetSize(amount)}
                style={buttonStyle}
              >
                {amount} ICP
              </Button>
            </Col>
          ))}
        </Row>

        <Row>
          <Button onClick={handleSubmitFlip} style={flipButtonStyle}>
            Flip
          </Button>
        </Row>
      </Container>
      {/* </Card.Body> */}
      {/* </Card> */}
    </Container>
  );
}

export default ControlInterface;
