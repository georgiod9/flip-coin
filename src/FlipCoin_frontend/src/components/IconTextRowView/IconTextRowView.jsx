function IconTextRowView({
  IconComponent,
  text,
  iconColor,
  overrideContainerStyle = {},
  overrideTextStyle = {},
  clickHandler,
}) {
  const textMutedStyle = {
    color: "grey",
    fontStyle: "italic",
    fontSize: "16px",
    textAlign: "right",
    margin: "0",
  };
  const containerStyleDefault = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    alignItems: "center",
    columnGap: "10px",
    width: "100%",
  };
  const containerStyle = {
    ...containerStyleDefault,
    ...overrideContainerStyle,
  };

  const textStyle = { ...textMutedStyle, ...overrideTextStyle };

  return (
    <div onClick={clickHandler} style={containerStyle}>
      <IconComponent
        className="clickable"
        sx={{ fontSize: 16 }}
        style={{ color: iconColor }}
      />
      <p style={textStyle}>{text}</p>
    </div>
  );
}
export default IconTextRowView;
