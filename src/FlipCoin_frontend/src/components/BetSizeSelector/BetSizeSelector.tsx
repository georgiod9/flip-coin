import { Container } from "react-bootstrap";
import coinIcon from "../../assets/svg/coin_hq.svg";
import inputButton from "../../assets/svg/input-button-v2.svg";
import { playSoundEffects } from "../../scripts/SoundEffects";

import "./BetSizeSelector.css";

interface BetSizeSelectorProps {
  betSizeControl: [number, (amount: number) => void];
  callToaster: (
    success: boolean,
    title: string,
    message: string,
    icon: string,
    duration: number
  ) => void;
  isIdentified: boolean;
  isLoading: boolean;
}

function BetSizeSelector({
  betSizeControl,
  callToaster,
  isIdentified,
  isLoading,
}: BetSizeSelectorProps) {
  const [bidAmount, setBidAmount] = betSizeControl;
  const bidAmounts = [0.1, 0.5, 1, 2];

  const handleChooseBetSize = (amount: number) => {
    playSoundEffects.click();

    if (!isIdentified) {
      callToaster(false, `Failed`, `Please connect your wallet`, "", 2000);
      return;
    }
    setBidAmount(amount);
    callToaster(true, `Bid Placed`, `You're bidding ${amount} ICP.`, "", 2000);
  };

  return (
    <Container className="bet-size-container">
      <div className="bet-interface-wrapper">
        <div className="bet-interface">
          <img className="coin-icon" src={coinIcon} alt="Coin" />
          <div className={`coin-icon-glow ${isLoading ? "active" : ""}`}></div>

          {/* <p className="main-text">{text}</p> */}

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
