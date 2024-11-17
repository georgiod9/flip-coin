import { useEffect, useState } from "react";
import { Col, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";
import { e8sToIcp } from "../../scripts/e8s";
import houseFundsContainer from "../../assets/svg/Top_Left_House_Fund_container.svg";
import dollarIcon from "../../assets/svg/dollar_sign.svg";
import headsTokenImg from "../../assets/svg/Heads_Token.svg";
import tailsTokenImg from "../../assets/svg/Tails_Token.svg";
import coinsContainerImg from "../../assets/svg/coin_history_container.svg";

import "./header.css";
import AuthIdentity from "../LoginComponent/AuthIdentity";
import { FlipHistory } from "../FlipHistory/FlipHistory";

function Header({
  walletIdentity,
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
  const [isMobileWidth, setMobileWidth] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
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

  const dollarIconstyle = {
    width: "clamp(15px,1vw, 30px)",
  };

  useEffect(() => {
    // console.log(`Account balance changed.`, accountBalance);
  }, [accountBalance]);

  useEffect(() => {
    const fromBackendFetch_RecentFlips = async () => {
      if (FlipCoin_backend) {
        FlipCoin_backend.getLastFlipId().then((id) => {
          setLastFlipId(id);
          let start = Number(id) - 10 > 0 ? Number(id) - 10 : 0;

          FlipCoin_backend.getFlipHistory(start, id).then((flips) => {
            console.log(`flip history: `, flips);
            setFlipHistory(flips);
          });
        });
      }
    };
    fromBackendFetch_RecentFlips();
  }, [refresh, FlipCoin_backend]);

  useEffect(() => {
    const fromBackendFetch_Statistics = async () => {
      FlipCoin_backend.getStatistics().then((statistics) => {
        console.log(`Fetched statistics`, statistics);
        setStats({ initialized: true, ...statistics });
      });
    };
    fromBackendFetch_Statistics();
  }, [refresh]);

  return (
    <div
      className="header-main-div"
      style={{
        position: "relative",
        // border: "1px solid red",
      }}
    >
      <div
        className="header-item-1-pos"
        style={
          {
            // position: "absolute",
            // top: "50%",
            // left: "10%",
            // transform: "translate(-50%, 0%)",
          }
        }
      >
        <div style={{ position: "relative" }}>
          <img
            src={houseFundsContainer}
            className="house-funds-container-sizing"
            // style={{ maxWidth: "20vw" }}
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
            {flipCoinCanisterBalance ? (
              <p style={houseFundsTextStyle}>
                {e8sToIcp(flipCoinCanisterBalance).toFixed(2).toString()} $ICP
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-center-coins-container-pos">
        <FlipHistory flipHistory={flipHistory} statistics={stats} />
      </div>

      <div className="header-item-3-pos">
        <AuthIdentity
          walletIdentity={walletIdentity}
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
      </div>
    </div>
  );
}

export default Header;
