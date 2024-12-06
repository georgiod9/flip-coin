import { Container } from "react-bootstrap";

import "./SelectButton.css";
function SelectButton({ text, onClick, type }) {
  return (
    <div className={`select-button ${type}`} onClick={onClick}>
      <p className="select-button-text">{text}</p>
    </div>
  );
}

export default SelectButton;
