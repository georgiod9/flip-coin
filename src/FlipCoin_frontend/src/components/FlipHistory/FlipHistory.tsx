import { Container, Spinner } from "react-bootstrap";
import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";
import coinsContainerImg from "../../assets/svg/coin_history_container.svg";

interface FlipHistory {
  entropyBlob: number[];
  result: boolean;
  timestamp: number;
}
interface Statistics {
  headsCount: number;
  headsRate: number;
  tailsCount: number;
  tailsRate: number;
}

const coinsContainerStyle = {
  width: "100%",
  // maxWidth: "clamp(600px,33vw,100%)",
  height: "auto",
  // border: "1px solid red",
};

const tokenImageStyle = {
  width: "100%",
  // height: "auto",
};

export const FlipHistory = ({
  flipHistory,
  statistics,
}: {
  flipHistory: FlipHistory[];
  statistics: Statistics;
}) => {
  return (
    <>
      <div style={{ position: "relative" }} className="coins-wrapper">
        <img style={coinsContainerStyle} src={coinsContainerImg}></img>
        <Container
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
          className="d-flex flex-row justify-content-center align-items-center"
        >
          {flipHistory && flipHistory.length > 0 ? (
            flipHistory.map((flip: FlipHistory, index: number) => (
              <div key={index}>
                <img
                  style={tokenImageStyle}
                  src={flip.result === true ? headsTokenImg : tailsTokenImg}
                  alt={flip.result === true ? "Heads" : "Tails"}
                />
              </div>
            ))
          ) : (
            <Spinner />
          )}
        </Container>
      </div>
      <div style={{ textAlign: "center" }}>
        {statistics && (
          <>
            <p style={{ fontSize: "1rem", padding: "0" }}>
              Heads:{" "}
              {statistics.headsRate ? (
                statistics.headsRate?.toFixed(2).toString()
              ) : (
                <Spinner style={{ width: "1rem", height: "1rem" }} />
              )}
              {""}% Tails:{" "}
              {statistics.tailsRate ? (
                statistics.tailsRate?.toFixed(2).toString()
              ) : (
                <Spinner style={{ width: "1rem", height: "1rem" }} />
              )}
              {""}%
            </p>
          </>
        )}
      </div>
    </>
  );
};
