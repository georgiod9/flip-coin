function Spacer({ space, unit }) {
  const spacerStyle = {
    height: unit && unit == "vh" ? `${space}vh` : `${space}px`,
  };
  return <div style={spacerStyle}></div>;
}

export default Spacer;
