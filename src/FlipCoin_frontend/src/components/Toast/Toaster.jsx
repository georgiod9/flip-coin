import { useEffect, useState } from "react";
import { Toast } from "react-bootstrap";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import IconTextRowView from "../IconTextRowView/IconTextRowView";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
export default function Toaster({
  headerContent,
  toastStatus,
  toastData,
  textColor,
  show,
  onHide,
  timeout,
  link,
  overrideTextStyle,
}) {
  const header = headerContent;
  const backgroundColor = "#260B50";

  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show && fadeOut) {
      // Set a timeout to call onHide after the animation
      const timer = setTimeout(() => {
        onHide();
        setFadeOut(false); // Reset the fadeOut state
      }, 2000); // This should match the duration of your CSS animation
      return () => clearTimeout(timer);
    }
  }, [show, fadeOut, onHide]);

  const handleClose = () => {
    setFadeOut(true);
    onHide();
  };
  return (
    <Toast
      className={fadeOut ? "fade-out" : ""}
      style={{
        maxWidth: "clamp(300px, 20vw, 600px)",
        position: "fixed",
        right: "2%",
        top: "10%",
        backgroundColor: backgroundColor,
        zIndex: 200000,
      }}
      // onClose={() => { onHide(); }}
      onClose={handleClose}
      show={show}
      delay={timeout}
      autohide
    >
      <Toast.Header style={{ backgroundColor: backgroundColor }}>
        {toastStatus ? (
          <IconTextRowView
            text={headerContent}
            IconComponent={CheckCircleOutlineIcon}
            iconColor={"#50FF97"}
          />
        ) : (
          <IconTextRowView
            text={headerContent}
            IconComponent={WarningAmberIcon}
            iconColor={"#FF3131"}
          />
        )}
        {/* <IconTextRowView text={headerContent} IconComponent={WarningAmberIcon} /> */}

        {/* <strong style={{ color: toastStatus ? '#50FF97' : '#FF3131' }} className="me-auto">{headerContent}</strong> */}
        <small style={{ color: "white" }}>now</small>
      </Toast.Header>
      <Toast.Body
        style={{ maxWidth: "35vw", backgroundColor: backgroundColor }}
      >
        <div className="flexbox-row space-between">
          <p style={{ margin: "0" }}>{toastData}</p>
          {link?.length > 0 && (
            <a href={link} target="_blank" rel="noreferrer">
              {link.includes("metamask")
                ? "Install Metamask"
                : "View transaction"}
            </a>
          )}
          <div style={{ wordBreak: "break-word" }}></div>
        </div>
      </Toast.Body>
    </Toast>
  );
}
