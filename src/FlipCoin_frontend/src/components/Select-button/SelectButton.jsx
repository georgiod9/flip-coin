import { Container } from "react-bootstrap";
import selectButtonImage from "../../assets/1x/Head_button_container.png";
import submitButtonImage from "../../assets/1x/Flip_button_container.png";

function SelectButton({ text, onClick, type }) {
  const buttonStyle = {
    width: "100%",
    height: "100%",
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
  return (
    <Container style={containerStyle} onClick={onClick}>
      <img
        src={type === "select-side" ? selectButtonImage : submitButtonImage}
        style={buttonStyle}
      ></img>
      <p style={textStyle}>{text}</p>
    </Container>
  );
}
export default SelectButton;
