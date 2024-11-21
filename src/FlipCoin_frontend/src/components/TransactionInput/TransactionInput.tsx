import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import "./TransactionInput.css";
interface TransactionInputProps {
  onTopUp: (amount: number) => void;
  buttonText: string;
  maxAmount?: number;
  isWithdraw?: boolean;
}

export function TransactionInput({
  onTopUp,
  buttonText,
  maxAmount,
  isWithdraw = false,
}: TransactionInputProps) {
  const [amount, setAmount] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (amount && !isNaN(Number(amount))) {
      onTopUp(Number(amount));
      setAmount("");
    }
  };

  const handleMaxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (maxAmount) {
      setAmount(maxAmount.toString());
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <InputGroup size="sm" className="top-up-group">
        <Form.Control
          type="number"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
          placeholder="Amount"
          min="0"
          max={maxAmount}
          step="0.01"
          className="top-up-input"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        {isWithdraw && (
          <Button
            variant="outline-secondary"
            onClick={handleMaxClick}
            className="max-button"
            disabled={maxAmount === undefined || maxAmount <= 0}
          >
            Max
          </Button>
        )}
        <Button
          variant="outline-light"
          type="submit"
          className="top-up-button"
          disabled={
            !amount ||
            isNaN(Number(amount)) ||
            (maxAmount !== undefined && Number(amount) > maxAmount)
          }
        >
          {buttonText}
        </Button>
      </InputGroup>
    </Form>
  );
}
