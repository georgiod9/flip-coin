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
import { NeonContainer } from "../NeonContainer/NeonContainer";

function Header({
  walletIdentity,
  refreshControl,
  setShowTopUpModal,
  accountBalance,
  accountCredit,
  identifiedActor,
  identifiedIcpLedgerActor,
  isWalletConnected,
  flipCoinCanisterBalance,
  setWalletIdentity,
  setIdentifiedIcpLedgerActor,
  setIsIdentified,
  setIdentifiedActor,
  setLedgerCanisterPrincipal,
  setBackendActor,
  callToaster,
  toggleRefresh,
  hasPendingControl,
}) {
  const [isMobileWidth, setMobileWidth] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [refresh] = refreshControl;
  const [hasPending, setHasPending] = hasPendingControl;

  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });

  useEffect(() => {
    const fromBackendFetch_RecentFlips = async () => {
      if (FlipCoin_backend) {
        setHasPending((prev) => [...prev, "getRecentFlips"]);

        FlipCoin_backend.getLastFlipId()
          .then((id) => {
            setLastFlipId(id);
            let start = Number(id) - 10 > 0 ? Number(id) - 10 : 0;

            FlipCoin_backend.getFlipHistory(start, id).then((flips) => {
              console.log(`flip history: `, flips);
              setFlipHistory(flips);
            });
          })
          .finally(() => {
            setHasPending((prev) =>
              prev.filter((item) => item !== "getRecentFlips")
            );
          });
      }
    };
    fromBackendFetch_RecentFlips();
  }, [refresh, FlipCoin_backend]);

  useEffect(() => {
    const fromBackendFetch_Statistics = async () => {
      setHasPending((prev) => [...prev, "getStatistics"]);

      FlipCoin_backend.getStatistics()
        .then((statistics) => {
          console.log(`Fetched statistics`, statistics);
          setStats({ initialized: true, ...statistics });
        })
        .finally(() => {
          setHasPending((prev) =>
            prev.filter((item) => item !== "getStatistics")
          );
        });
    };
    fromBackendFetch_Statistics();
  }, [refresh]);

  return (
    <div className="header-main-div">
      <div className="header-item-1-pos">
        <NeonContainer variant="house">
          <div className="house-funds-wrapper">
            <div className="house-funds-icon">
              <img
                src={dollarIcon}
                alt="Dollar Icon"
                className="house-funds-icon-img"
              />
            </div>
            <div className="house-funds-label">
              <p>House</p>
            </div>
            <div className="house-funds-amount">
              {flipCoinCanisterBalance ? (
                <p>
                  {e8sToIcp(flipCoinCanisterBalance).toFixed(2).toString()} ICP
                </p>
              ) : (
                <div className="spinner-container">
                  <Spinner
                    // style={{ width: "1rem", height: "1rem" }}
                    className="wallet-spinner"
                  />
                </div>
              )}
            </div>
          </div>
        </NeonContainer>
      </div>

      <div className="header-center-coins-container-pos">
        <NeonContainer variant="wide">
          <FlipHistory flipHistory={flipHistory} statistics={stats} />
        </NeonContainer>

        <div style={{ textAlign: "center" }}>
          {stats && (
            <>
              <p style={{ fontSize: "1rem", padding: "0" }}>
                Heads:{" "}
                {stats.headsRate ? (
                  stats.headsRate?.toFixed(2).toString()
                ) : (
                  <Spinner className="wallet-spinner-small" />
                )}
                {""}% Tails:{" "}
                {stats.tailsRate ? (
                  stats.tailsRate?.toFixed(2).toString()
                ) : (
                  <Spinner className="wallet-spinner-small" />
                )}
                {""}%
              </p>
            </>
          )}
        </div>
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
          identifiedActor={identifiedActor}
          identifiedIcpLedgerActor={identifiedIcpLedgerActor}
          callToaster={callToaster}
          toggleRefresh={toggleRefresh}
          hasPendingControl={hasPendingControl}
        />
      </div>
    </div>
  );
}

export default Header;
