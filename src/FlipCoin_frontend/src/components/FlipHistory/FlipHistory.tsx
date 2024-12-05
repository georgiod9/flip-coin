import { Spinner } from "react-bootstrap";
import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";
import "./FlipHistory.css";

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

export const FlipHistory = ({
  flipHistory,
  statistics,
}: {
  flipHistory: FlipHistory[];
  statistics: Statistics;
}) => {
  return (
    <div className="flip-history-container">
      <div className="coins-wrapper">
        <div className="coins-container">
          {flipHistory && flipHistory.length > 0 ? (
            flipHistory.map((flip: FlipHistory, index: number) => (
              <div key={index}>
                <img
                  className="coin-token"
                  src={flip.result === true ? headsTokenImg : tailsTokenImg}
                  alt={flip.result === true ? "Heads" : "Tails"}
                />
              </div>
            ))
          ) : (
            <div className="spinner-container">
              <Spinner
                // style={{ width: "1rem", height: "1rem" }}
                className="wallet-spinner"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
