import { useEffect, useState } from "react";
import { Col, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import { e8sToIcp } from "../../scripts/e8s";
import houseFundsContainer from "../../assets/svg/Top_Left_House_Fund_container.svg";
import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";
import "./header.css";

function Header({
  refreshControl,
  setShowTopUpModal,
  accountBalance,
  accountCredit,
  isWalletConnected,
  flipCoinCanisterBalance,
}) {
  const [refresh] = refreshControl;
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });

  const tokenImageStyle = {
    // width: "80%",
    // height: "auto",
  };

  useEffect(() => {
    console.log(`Account balance changed.`, accountBalance);
  }, [accountBalance]);

  useEffect(() => {
    const fromBackendFetch_RecentFlips = async () => {
      FlipCoin_backend.getLastFlipId().then((id) => {
        setLastFlipId(id);
        let start = Number(id) - 10 > 0 ? Number(id) - 10 : 0;

        FlipCoin_backend.getFlipHistory(start, id).then((flips) => {
          console.log(`flip history: `, flips);
          setFlipHistory(flips);
        });
      });
    };
    fromBackendFetch_RecentFlips();
  }, [refresh]);

  useEffect(() => {
    const fromBackendFetch_Statistics = async () => {
      FlipCoin_backend.getStatistics().then((statistics) => {
        setStats({ initialized: true, ...statistics });
      });
    };
    fromBackendFetch_Statistics();
  }, [refresh]);

  return (
    <Container
      fluid
      style={{
        width: "100vw",
        height: "max-content",
        margin: "0",
        padding: "10px 10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <Col
        xs="auto"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          // border: "1px solid red",
        }}
      >
        <img
          src={houseFundsContainer}
          style={{ maxWidth: "30vw" }}
          alt="House Funds"
        />
        {/* <p style={containerTextStyle}>
          House Funds: {e8sToIcp(flipCoinCanisterBalance)} $ICP
        </p> */}
      </Col>

      <Col
        xs="auto"
        style={{
          display: "flex",
          alignItems: "center",
          // border: "1px solid green",
        }}
      >
        <Container
          fluid
          style={{
            height: "100%",
            padding: "15px 35px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          className="d-flex flex-row justify-content-center align-items-center header-center-container"
        >
          {flipHistory.map((flip, index) => (
            <div key={index}>
              <img
                style={tokenImageStyle}
                src={flip.result === true ? headsTokenImg : tailsTokenImg}
                alt={flip.result === true ? "Heads" : "Tails"}
              />
            </div>
          ))}
        </Container>
      </Col>

      <Col
        xs="auto"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          border: "1px solid blue",
        }}
      >
        {accountBalance === 0 || accountBalance ? (
          <Container className="d-flex flex-column justify-content-center align-items-start">
            <p style={{ fontSize: "12px", margin: "0", padding: "0" }}>
              On-chain: {e8sToIcp(accountBalance).toString()} ICP
            </p>
            <p style={{ fontSize: "12px", margin: "0", padding: "0" }}>
              Credit: {e8sToIcp(accountCredit).toString()} ICP
            </p>
          </Container>
        ) : (
          <Spinner />
        )}
      </Col>
    </Container>
  );
}

export default Header;
