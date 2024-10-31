import { Container } from "react-bootstrap";
// import selectButtonImage from "../../assets/1x/Head_button_container.png";
import selectButtonImage from "../../assets/svg/select-side-button-v2.svg";
// import submitButtonImage from "../../assets/1x/Flip_button_container.png";
import submitButtonImage from "../../assets/svg/submit-flip-button.svg";

function SelectButton({ text, onClick, type }) {
  const buttonStyle = {
    width: "100%",
    height: "100%",
    // padding: "5px 5px",
    // cursor: "pointer",
  };
  const containerStyle = {
    position: "relative",
    width: "fit-content",
    cursor: "pointer",
    // border: "1px solid red",
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

  const buttonPrimaryFontFamily = {
    fontFamily: "AcuminVariableConcept",
  };
  const buttonSecondaryFamily = {
    fontFamily: "AcuminVariableConcept",
  };

  const buttonFontStyle =
    type === "select-side" ? buttonPrimaryFontFamily : buttonSecondaryFamily;
  return (
    <Container style={containerStyle} onClick={onClick}>
      <div style={{ cursor: "pointer" }}>
        <img
          src={type === "select-side" ? selectButtonImage : submitButtonImage}
          style={buttonStyle}
          className="glow-effect-rectangle"
        ></img>
        <p style={{ ...textStyle, ...buttonFontStyle }}>{text}</p>
      </div>
    </Container>
  );
}
export default SelectButton;
