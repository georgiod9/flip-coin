import { useState, MouseEvent } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "./TransferModal.css";
import { _SERVICE as IcpLedgerService } from "../../../../declarations/icp_ledger_canister/icp_ledger_canister.did";
import { e8sToIcp } from "../../scripts/e8s";
import { validatePrincipal } from "../../scripts/getPrincipal";
import { transferICP } from "../../scripts/icpLedger";
import { playSoundEffects } from "../../scripts/SoundEffects";

interface TransferModalProps {
  show: boolean;
  myPrincipal: string;
  onHide: () => void;
  identifiedIcpLedgerActor: IcpLedgerService | null;
  balance: number | null;
  callToaster: (
    status: boolean,
    header: string,
    data: string,
    link: string,
    timeout: number
  ) => void;
  toggleRefresh: () => void;
  hasPendingControl: [string[], React.Dispatch<React.SetStateAction<string[]>>];
}

export function TransferModal({
  show,
  myPrincipal,
  onHide,
  identifiedIcpLedgerActor,
  balance,
  callToaster,
  toggleRefresh,
  hasPendingControl,
}: TransferModalProps) {
  const [destinationPrincipal, setDestinationPrincipal] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [hasPending, setHasPending] = hasPendingControl;

  const handleModalClick = (e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMaxClick = () => {
    if (balance) {
      setAmount(e8sToIcp(balance).toString());
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    if (balance) {
      const maxAmount = e8sToIcp(balance);
      // Convert to numbers for comparison, handle empty string case
      const numericAmount = newAmount === "" ? 0 : Number(newAmount);

      if (numericAmount > maxAmount) {
        setAmount(maxAmount.toString());
      } else if (numericAmount < 0) {
        setAmount("0");
      } else {
        setAmount(newAmount);
      }
    }
  };

  const handleCashout = async () => {
    try {
      if (!amount) {
        callToaster(
          false,
          "Warning",
          "Please enter an amount to cashout.",
          "",
          1500
        );
        return;
      }

      if (!destinationPrincipal) {
        callToaster(
          false,
          "Warning",
          "Please enter a destination principal.",
          "",
          2000
        );
        return;
      }

      if (!validatePrincipal(destinationPrincipal)) {
        callToaster(
          false,
          "Warning",
          "Invalid destination principal.",
          "",
          2000
        );
        return;
      }

      if (myPrincipal === destinationPrincipal) {
        callToaster(
          false,
          "Cashout Failed",
          "Cannot cashout to self.",
          "",
          2000
        );
        return;
      }
      setHasPending((prev) => [...prev, "cashout"]);

      callToaster(true, "Cashing Out", "Transaction sent!", "", 1500);

      const result = await transferICP(
        parseFloat(amount),
        destinationPrincipal,
        identifiedIcpLedgerActor
      );

      if (result.success) {
        playSoundEffects.transfer();

        callToaster(true, "Cashout Success", "Cashout successful.", "", 1500);
        toggleRefresh();
        onHide();
      } else {
        if (result.error) {
          callToaster(false, "Cashout Failed", result.error, "", 1500);
        } else {
          callToaster(
            false,
            "Cashout Failed",
            "An unknown error occurred. Please try again or contact support.",
            "",
            1500
          );
        }
      }
      setHasPending((prev) => prev.filter((item) => item !== "cashout"));
    } catch (error) {
      console.error(`Error cashing out`, error);
      callToaster(
        false,
        "Cashout Failed",
        "An unknown error occurred. Please try again or contact support.",
        "",
        1500
      );
      setHasPending((prev) => prev.filter((item) => item !== "cashout"));
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="transfer-modal"
      onClick={handleModalClick}
    >
      <Modal.Header closeButton>
        <Modal.Title>Cashout</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <div className="input-row">
            <Form.Group className="form-group">
              <Form.Label>Destination Principal</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter principal ID"
                value={destinationPrincipal}
                onChange={(e) => setDestinationPrincipal(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="form-group amount-group">
              <Form.Label>Amount (ICP)</Form.Label>
              <div className="amount-container">
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  min="0"
                  step="0.0001"
                />
                <Button
                  className="max-button"
                  variant="outline-light"
                  onClick={handleMaxClick}
                >
                  Max
                </Button>
              </div>
            </Form.Group>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCashout}>
          Transfer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
