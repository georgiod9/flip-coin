import { useEffect, useState } from "react";
import { Col, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import { e8sToIcp } from "../../scripts/e8s";
import houseFundsContainer from "../../assets/svg/Top_Left_House_Fund_container.svg";
import dollarIcon from "../../assets/svg/dollar_sign.svg";
import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";
// import coinsContainerImg from "../../assets/svg/top_center_container.svg";
import coinsContainerImg from "../../assets/svg/coin_history_container.svg";

import "./header.css";
import AuthIdentity from "../LoginComponent/AuthIdentity";

function Header({
  refreshControl,
  setShowTopUpModal,
  accountBalance,
  accountCredit,
  isWalletConnected,
  flipCoinCanisterBalance,
  setWalletIdentity,
  setIdentifiedIcpLedgerActor,
  setIsIdentified,
  setIdentifiedActor,
  setLedgerCanisterPrincipal,
  setBackendActor,
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

  const houseFundsTextStyle = {
    margin: "0px 0px",
    whiteSpace: "nowrap",
    fontSize: "clamp(16px,0.1vw,40px)",
  };

  const tokenImageStyle = {
    // width: "80%",
    // height: "auto",
  };

  const coinsContainerStyle = {
    width: "100%",
    maxWidth: "clamp(600px,33vw,100%)",
    height: "auto",
  };

  const dollarIconstyle = {
    width: "clamp(15px,1vw, 30px)",
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
        <div style={{ position: "relative" }}>
          <img
            src={houseFundsContainer}
            style={{ maxWidth: "20vw" }}
            alt="House Funds"
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "15%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <img style={dollarIconstyle} src={dollarIcon}></img>
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "30%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <p style={houseFundsTextStyle}>House</p>
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "5%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <p style={houseFundsTextStyle}>
              {e8sToIcp(flipCoinCanisterBalance).toFixed(2).toString()} $ICP
            </p>
          </div>
        </div>

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
        // fluid
        // style={{
        //   height: "100%",
        //   // padding: "15px 35px",
        //   display: "flex",
        //   justifyContent: "center",
        //   alignItems: "center",
        // }}
        // className="d-flex flex-row justify-content-center align-items-center" //header-center-container
        >
          <div style={{ position: "relative" }}>
            <img style={coinsContainerStyle} src={coinsContainerImg}></img>
            <Container
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
              }}
              className="d-flex flex-row justify-content-center align-items-center"
            >
              {flipHistory && flipHistory.length > 0 ? (
                flipHistory.map((flip, index) => (
                  <div key={index}>
                    <img
                      style={tokenImageStyle}
                      src={flip.result === true ? headsTokenImg : tailsTokenImg}
                      alt={flip.result === true ? "Heads" : "Tails"}
                    />
                  </div>
                ))
              ) : (
                <Spinner />
              )}
            </Container>
          </div>
        </Container>
      </Col>

      <Col
        xs="auto"
        style={{
          position: "absolute",
          right: 5,
          top: 10,
          display: "flex",
          alignItems: "center",
          // border: "1px solid blue",
        }}
      >
        <AuthIdentity
          isWalletConnected={isWalletConnected}
          setWalletIdentity={setWalletIdentity}
          setIdentifiedIcpLedgerActor={setIdentifiedIcpLedgerActor}
          setIsIdentified={setIsIdentified}
          setIdentifiedActor={setIdentifiedActor}
          setLedgerCanisterPrincipal={setLedgerCanisterPrincipal}
          setBackendActor={setBackendActor}
          accountBalance={accountBalance}
          accountCredit={accountCredit}
        />
      </Col>
    </Container>
  );
}

export default Header;
