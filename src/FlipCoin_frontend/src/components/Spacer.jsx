import { useEffect, useState } from "react";
import { Col, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";

function Spacer({ space, unit }) {
  const [lastFlipId, setLastFlipId] = useState(0);

  const spacerStyle = {
    // marginTop: `${space / 2}px`,
    // marginBottom: `${space / 2}px`,
    height: unit && unit == "vh" ? `${space}vh` : `${space}px`,
  };
  return <div style={spacerStyle}></div>;
}

export default Spacer;
