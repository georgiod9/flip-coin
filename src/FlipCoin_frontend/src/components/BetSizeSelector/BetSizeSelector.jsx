import { Container } from "react-bootstrap";
// import inputButton from "../../assets/svg/input-button.svg";
import inputButton from "../../assets/svg/input-button-v2.svg";
// import mainContainerImg from "../../assets/svg/main_container_interface.svg";
import mainContainerImg from "../../assets/svg/main-container-interface.svg";
import coinIcon from "../../assets/svg/coin.svg";
// import bidGlowImg from "../../assets/svg/input-button-glow.svg";
import bidGlowImg from "../../assets/1x/input-button-glow.png";
// import "./betsizeselector-style.css";

function BetSizeSelector({ text, onClick, betSizeControl, callToaster }) {
  const [bidAmount, setBidAmount] = betSizeControl;

  const mainContainerStyle = {
    position: "relative",
    width: "100%",
    height: "auto",
  };

  const textStyle = {
    position: "absolute",
    margin: "0",
    padding: "0px 0px",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    whiteSpace: "nowrap",
    fontSize: "clamp(18px,1.5vw,24px)",
  };

  const buttonsContainerStyle = {
    position: "absolute",
    bottom: "20px", // Adjust as needed to position the buttons correctly
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    justifyContent: "center",
    width: "65%",
  };

  const inputButtonStyle = {
    width: "100%",
    position: "relative",
    margin: "0 5px",
  };

  const inputButtonContainerStyle = {
    position: "relative",
    textAlign: "center",
    borderRadius: "0px",
    cursor: "pointer",
    // padding: "5px 5px",
    margin: "3px 3px",
  };

  const bidAmounts = [0.1, 0.5, 1, 2];

  const inputTextStyle = {
    position: "absolute",
    margin: "0",
    padding: "0px 0px",
    top: "40%",
    left: "55%",
    transform: "translate(-50%,-50%)",
    whiteSpace: "nowrap",
    fontSize: "clamp(12px,1.5vw,40px)",
  };

  const inputTextStyleIcp = {
    position: "absolute",
    margin: "0",
    padding: "0px 0px",
    top: "70%",
    left: "55%",
    transform: "translate(-50%,-50%)",
    whiteSpace: "nowrap",
    fontSize: "clamp(10px,1.5vw,14px)",
  };

  const coinIconStyle = {
    width: "60%",
    height: "60%",
    position: "absolute",
    top: "25%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };

  const handleChooseBetSize = (amount) => {
    setBidAmount(amount);
    callToaster(true, `Bid Placed`, `You're bidding ${amount} ICP.`, 2000);
  };

  return (
    <Container
      style={{
        position: "relative",
        width: "fit-content",
      }}
      onClick={onClick}
    >
      <img
        src={mainContainerImg}
        style={mainContainerStyle}
        alt="Main Container"
      />
      <img
        // className="coin-flip-animation"
        style={coinIconStyle}
        src={coinIcon}
      ></img>
      <Container fluid style={buttonsContainerStyle}>
        {bidAmounts.map((amount, index) => (
          <Container
            key={index}
            onClick={() => handleChooseBetSize(amount)}
            style={inputButtonContainerStyle}
          >
            <img
              src={inputButton}
              style={inputButtonStyle}
              className="glow-effect"
              alt={`Bid ${amount} ICP`}
            />
            {/* <img src={bidGlowImg} style={inputButtonStyle}></img> */}
            <Container className="d-flex flex-column justify-content-center align-items-center">
              <p style={inputTextStyle}>{amount}</p>
              <p style={inputTextStyleIcp}>ICP</p>
            </Container>
          </Container>
        ))}
      </Container>
      <p style={textStyle}>{text}</p>
    </Container>
  );
}

export default BetSizeSelector;
