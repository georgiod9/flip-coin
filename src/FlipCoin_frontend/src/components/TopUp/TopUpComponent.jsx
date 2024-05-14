import { useState } from "react";
import { Button, Container, Form, FormGroup, Modal } from "react-bootstrap";

export function TopUpComponent({ showControl }) {
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [show, setShow] = showControl;
  const topUp = async (e) => {
    e.preventDefault();
  };

  const onChangeTopUpAmount = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setTopUpAmount(value);
    }
  };

  return (
    <Container>
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "black" }}>Top Up Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={topUp}>
            <FormGroup>
              <Form.Label style={{ color: "black", fontSize: "14px" }}>
                Amount
              </Form.Label>
              <Form.Control
                onChange={onChangeTopUpAmount}
                value={topUpAmount}
                type="text"
                placeholder={""}
              />
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" type="submit" onClick={topUp}>
            Submit
          </Button>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
