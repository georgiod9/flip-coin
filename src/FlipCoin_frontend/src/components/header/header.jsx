import { useEffect, useState } from "react";
import { Button, Col, Container, Spinner } from "react-bootstrap";
import { FlipCoin_backend } from "declarations/FlipCoin_backend";

function Header({ refreshControl, setShowTopUpModal }) {
  const [triggerRefresh, setTriggerRefresh] = refreshControl;
  const [lastFlipId, setLastFlipId] = useState(0);
  const [flipHistory, setFlipHistory] = useState([]);
  const [stats, setStats] = useState({
    initialized: false,
    tailsRate: null,
    tailsCount: null,
    headsRate: null,
    headsCount: null,
  });
  const containerBorder = {
    width: "100vw",
    height: "50px",
    margin: "0",
    padding: "10px 10px",
    border: "1px solid #009DDC",
  };

  const containerUI = {
    backgroundColor: "#009DDC",
  };

  const containerTextStyle = {
    fontSize: "12px",
    margin: "0",
    padding: "0",
  };

  const headsIconStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "100px",
    border: "1px solid #6761A8",
    backgroundColor: "#6761A8",
    position: "relative",
  };

  const tailsIconStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "100px",
    border: "1px solid #009B72",
    backgroundColor: "#009B72",
    position: "relative",
  };

  const flipResultTextStyle = {
    fontSize: "12px",
    color: "white",
    textAlign: "center",
    margin: "0",
    padding: "0",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };
  const historyContainerStyle = {
    backgroundColor: "white",
    height: "100%",
    padding: "5px 5px",
  };
  useEffect(() => {
    console.log(`test2`);
  }, []);

  useEffect(() => {
    const fromBackendFetch_RecentFlips = async () => {
      console.log(`logging...`);
      // Get last flip id
      FlipCoin_backend.getLastFlipId().then((id) => {
        setLastFlipId(id);
        let start = Number(id) - 14 > 0 ? Number(id) - 14 : 0;

        // Get history with paging
        FlipCoin_backend.getFlipHistory(start, id).then((flips) => {
          console.log(`logging2...`);

          console.log(`flip history: `, flips);
          setFlipHistory(flips);
        });
      });
    };
    fromBackendFetch_RecentFlips();
  }, [triggerRefresh]);

  useEffect(() => {
    const fromBackendFetch_Statistics = async () => {
      // Get count of tails and heads occurences
      FlipCoin_backend.getStatistics().then((statistics) => {
        setStats({ initialized: true, ...statistics });
        console.log(`statistic: `, statistics);
      });
    };
    fromBackendFetch_Statistics();
  }, [triggerRefresh]);

  return (
    <Container
      fluid
      style={{ ...containerBorder, ...containerUI }}
      className="d-flex flex-row justify-content-between align-items-center"
    >
      <Col xs={1} md={2}>
        <p style={containerTextStyle}>House Funds: 150 $ICP</p>
      </Col>
      <Col xs={8} md={5}>
        <Container
          fluid
          style={historyContainerStyle}
          className="d-flex flex-row justify-content-center align-items-center column-gap-1"
        >
          {flipHistory.map((flip) => (
            <div style={flip.result === true ? headsIconStyle : tailsIconStyle}>
              <p style={flipResultTextStyle}>
                {flip.result === true ? "H" : "T"}
              </p>
            </div>
          ))}
        </Container>
      </Col>

      <Col xs={2} md={3}>
        {stats && stats.initialized ? (
          <Container className="d-flex flex-row justify-content-center align-items-center column-gap-1">
            <p style={containerTextStyle}>
              Heads: {parseInt(stats.headsRate.toString())}%
            </p>
            <p style={containerTextStyle}>
              Tails: {parseInt(stats.tailsRate.toString())}%
            </p>
          </Container>
        ) : (
          <Spinner />
        )}
      </Col>

      <Col xs={1} md={"auto"}>
        <p style={containerTextStyle}>Connect Wallet</p>
        <p onClick={() => setShowTopUpModal(true)} style={containerTextStyle}>
          Top Up
        </p>
      </Col>
    </Container>
  );
}

export default Header;
