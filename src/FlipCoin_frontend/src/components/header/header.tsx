import { useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { e8sToIcp } from "../../scripts/e8s";
import dollarIcon from "../../assets/svg/dollar_sign.svg";

import "./header.css";
import AuthIdentity from "../LoginComponent/AuthIdentity";
import { FlipHistory } from "../FlipHistory/FlipHistory";
import { NeonContainer } from "../NeonContainer/NeonContainer";
import { useBackend } from "../../context/BackendContext/BackendContext";
import { useStateProvider } from "../../context/StateContext/StateContext";

interface HeaderProps {
  callToaster: any;
  toggleRefresh: any;
}
function Header({ callToaster, toggleRefresh }: HeaderProps) {
  /** Hooks */
  const {
    lastFlipId,
    flipHistory,
    statistics,
    isRefreshingFlipHistory,
    isRefreshingStatistics,
    isRefreshingHouseBalance,
    houseBalance,
  } = useBackend();

  const { addPendingTask, removePendingTask } = useStateProvider();

  useEffect(() => {
    if (isRefreshingFlipHistory) {
      addPendingTask("getRecentFlips");
    } else {
      removePendingTask("getRecentFlips");
    }
  }, [isRefreshingFlipHistory]);

  useEffect(() => {
    if (isRefreshingStatistics) {
      addPendingTask("getStatistics");
    } else {
      removePendingTask("getStatistics");
    }
  }, [isRefreshingStatistics]);

  useEffect(() => {
    if (isRefreshingHouseBalance) {
      addPendingTask("getHouseBalance");
    } else {
      removePendingTask("getHouseBalance");
    }
  }, [isRefreshingHouseBalance]);

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
              {houseBalance !== null ? (
                <p>{e8sToIcp(houseBalance).toFixed(2).toString()} ICP</p>
              ) : (
                <div className="spinner-container">
                  <Spinner className="wallet-spinner" />
                </div>
              )}
            </div>
          </div>
        </NeonContainer>
      </div>

      <div className="header-center-coins-container-pos">
        <NeonContainer variant="wide">
          <FlipHistory flipHistory={flipHistory} statistics={statistics} />
        </NeonContainer>

        <div>
          {statistics && (
            <div
              style={{
                textAlign: "center",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                columnGap: "5px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  columnGap: "5px",
                }}
              >
                <p style={{ fontSize: "1rem", padding: "0" }}>{"Heads: "}</p>
                {!(
                  isRefreshingStatistics &&
                  statistics.headsRate == 0 &&
                  statistics.tailsRate == 0
                ) ? (
                  <p style={{ fontSize: "1rem", padding: "0" }}>
                    {`${statistics.headsRate?.toFixed(0).toString()} %`}
                  </p>
                ) : (
                  <Spinner className="wallet-spinner-small" />
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  columnGap: "5px",
                }}
              >
                <p style={{ fontSize: "1rem", padding: "0" }}>{"Tails: "}</p>
                {!(
                  isRefreshingStatistics &&
                  statistics.tailsRate == 0 &&
                  statistics.headsRate == 0
                ) ? (
                  <p style={{ fontSize: "1rem", padding: "0" }}>
                    {`${statistics.tailsRate?.toFixed(0).toString()} %`}
                  </p>
                ) : (
                  <Spinner className="wallet-spinner-small" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="header-item-3-pos">
        <AuthIdentity callToaster={callToaster} toggleRefresh={toggleRefresh} />
      </div>
    </div>
  );
}

export default Header;
