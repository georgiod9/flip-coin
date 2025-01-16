import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";

import "./SelectButton.css";

interface SelectButtonProps {
  text: string;
  onClick: () => void;
  type: string;
}

function SelectButton({ text, onClick, type }: SelectButtonProps) {
  return (
    <div className={`select-button ${type}`} onClick={onClick}>
      <div
        className={`select-button-content ${
          type === "select-side" ? "select-side" : ""
        }`}
      >
        {type === "select-side" && (
          <img
            className="select-button-token-icon"
            src={text === "HEADS" ? headsTokenImg : tailsTokenImg}
          ></img>
        )}
        <p className="select-button-text">{text}</p>
      </div>
    </div>
  );
}

export default SelectButton;
