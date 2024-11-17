import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import "./TopUp.css";
interface TopUpComponentProps {
  onTopUp: (amount: number) => void;
}

export function TopUpComponent({ onTopUp }: TopUpComponentProps) {
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
          step="0.01"
          className="top-up-input"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <Button
          variant="outline-light"
          type="submit"
          className="top-up-button"
          disabled={!amount || isNaN(Number(amount))}
        >
          Top Up
        </Button>
      </InputGroup>
    </Form>
  );
}
