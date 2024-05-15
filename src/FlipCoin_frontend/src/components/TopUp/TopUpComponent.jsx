import { useState } from "react";
import { Button, Container, Form, FormGroup, Modal } from "react-bootstrap";
import { e8sToIcp, icpToE8s } from "../../scripts/e8s";
import { icp_ledger_canister } from "declarations/icp_ledger_canister";
import { Principal } from "@dfinity/principal";
import { getUserDepositAddress } from "../../scripts/getPrincipal";
import { depositTokens } from "../../scripts/topUp";

export function TopUpComponent({
  showControl,
  accountBalance,
  accountCredit,
  identifiedActor,
  identifiedIcpActor,
}) {
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [show, setShow] = showControl;

  const topUp = async (e) => {
    e.preventDefault();

    const amountInE8s = icpToE8s(parseFloat(topUpAmount)); // Convert ICP to e8s
    const TARGET_DEPOSIT_ADDRESS = "be2us-64aaa-aaaaa-qaabq-cai";
    const targetPrincipal = Principal.fromText("be2us-64aaa-aaaaa-qaabq-cai");

    const TARGET_DEPOSIT_ADDRESS_BYTES = targetPrincipal.toUint8Array();
    console.log(
      `TARGET_DEPOSIT_ADDRESS_BYTES add`,
      TARGET_DEPOSIT_ADDRESS_BYTES
    );

    try {
      // Retrieve deposit address
      const userDepositAddress = await getUserDepositAddress(identifiedActor);
      console.log(`trying to transfer: `, amountInE8s);
      console.log(`from acocunt: `);

      console.log(`userdeposit add`, userDepositAddress);

      const transferArgs = {
        to: userDepositAddress,
        from_subaccount: [],
        created_at_time: [],
        memo: BigInt(0x1),
        amount: { e8s: amountInE8s },
        fee: { e8s: 10_000 },
      };

      const result = await identifiedIcpActor.transfer(transferArgs);
      console.log("Transfer result:", result);

      console.log(`triggerin deposit....`);
      await triggerDepositTokens();
      console.log(`done deposit call....`);
    } catch (error) {
      console.error("Error during transfer:", error);
    }
  };

  const triggerDepositTokens = async () => {
    try {
      if (!identifiedActor) {
        throw new Error("Backend actor not identified.");
      }
      const deposit = await depositTokens(identifiedActor);
      console.log(`deposit:`, deposit);
    } catch (error) {
      return null;
    }
  };

  const onChangeTopUpAmount = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
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
          <p style={{ margin: "0 0", color: "black", fontSize: "12px" }}>
            On-chain Balance: {e8sToIcp(accountBalance).toString()} ICP
          </p>
          <p style={{ margin: "0 0", color: "black", fontSize: "12px" }}>
            Credit Available: {e8sToIcp(accountCredit).toString()} ICP
          </p>
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
