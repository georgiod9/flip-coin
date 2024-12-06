import { useEffect, useState } from "react";
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
          max={maxAmount || undefined}
          step="0.01"
          className="top-up-input"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        {isWithdraw && (
          <Button
            variant="outline-secondary"
            onClick={(e) => {
              e.stopPropagation();
              if (maxAmount) {
                setAmount(maxAmount.toString());
              }
            }}
            className="max-button"
            disabled={!maxAmount || maxAmount <= 0}
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
            Number(amount) <= 0 ||
            (maxAmount !== undefined && Number(amount) > maxAmount)
          }
        >
          {buttonText}
        </Button>
      </InputGroup>
    </Form>
  );
}
