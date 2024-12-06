import { Container } from "react-bootstrap";
import coinIcon from "../../assets/svg/coin_hq.svg";
import inputButton from "../../assets/svg/input-button-v2.svg";
import "./BetSizeSelector.css";

function BetSizeSelector({
  text,
  onClick,
  betSizeControl,
  callToaster,
  isIdentified,
}) {
  const [bidAmount, setBidAmount] = betSizeControl;
  const bidAmounts = [0.1, 0.5, 1, 2];

  const handleChooseBetSize = (amount) => {
    if (!isIdentified) {
      callToaster(false, `Failed`, `Please connect your wallet`, "", 2000);
      return;
    }
    setBidAmount(amount);
    callToaster(true, `Bid Placed`, `You're bidding ${amount} ICP.`, "", 2000);
  };

  return (
    <Container className="bet-size-container" onClick={onClick}>
      <div className="bet-interface-wrapper">
        <div className="bet-interface">
          <img className="coin-icon" src={coinIcon} alt="Coin" />

          <p className="main-text">{text}</p>

          <div className="bid-buttons-container">
            {bidAmounts.map((amount, index) => (
              <div
                key={index}
                className="bid-button-wrapper"
                onClick={() => handleChooseBetSize(amount)}
              >
                <div className="bid-button">
                  <p className="bid-amount">{amount}</p>
                  <p className="bid-currency">ICP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default BetSizeSelector;
