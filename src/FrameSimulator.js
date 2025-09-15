import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

const Page = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000;
  padding: 0 20px;
  transform: translateY(-10%);
  overflow: hidden;
`;

const DisplayContainer = styled.div`
  display: flex;
  gap: 30px;
`;

const DigitContainer = styled.div`
  position: relative;
  width: 120px;
  height: 180px;
`;

const Segment = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "active"
})`
  position: absolute;
  background-color: ${(props) => (props.active ? "#ff0000" : "#1a0000")};
  box-shadow: ${(props) => (props.active ? "0 0 10px #ff0000" : "none")};
  transition: all 0.2s ease;

  &.horizontal {
    width: 75px;
    height: 20px;
    left: 22px;
    clip-path: polygon(
      12px 0%,
      calc(100% - 12px) 0%,
      100% 50%,
      calc(100% - 12px) 100%,
      12px 100%,
      0% 50%
    );
  }

  &.vertical {
    width: 20px;
    height: 66px;
    clip-path: polygon(
      0% 10px,
      50% 0%,
      100% 10px,
      100% calc(100% - 10px),
      50% 100%,
      0% calc(100% - 10px)
    );
  }

  &.top {
    top: 14px;
  }

  &.middle {
    top: 95px;
  }

  &.bottom {
    top: 172px;
  }

  &.top-left {
    left: 4px;
    top: 32px;
  }

  &.top-right {
    right: 4px;
    top: 32px;
  }

  &.bottom-left {
    left: 4px;
    top: 110px;
  }

  &.bottom-right {
    right: 4px;
    top: 110px;
  }
`;

function FrameSimulator() {
  const [currentNumber, setCurrentNumber] = useState("    ");

  const getServerUrl = () => {
    let serverUrl = process.env.REACT_APP_SERVER_URL;
    if (serverUrl && !serverUrl.startsWith("http")) {
      const protocol = serverUrl.includes("localhost") ? "http" : "https";
      serverUrl = `${protocol}://${serverUrl}`;
    }
    return serverUrl;
  };

  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/get-current-question`);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.number !== undefined) {
        setCurrentNumber(formatNumber(data.number));
      }
    } catch (err) {
      // Silently handle fetch errors
    }
  }, []);

  // Segment patterns for each digit (a, b, c, d, e, f, g)
  // a=top, b=top-right, c=bottom-right, d=bottom, e=bottom-left, f=top-left, g=middle
  const digitSegments = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
    "-": [false, false, false, false, false, false, true],
    " ": [false, false, false, false, false, false, false]
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) {
      return "    ";
    }

    // Convert to string and pad with spaces for leading positions
    const numStr = String(num);
    if (numStr.length <= 4) {
      return numStr.padStart(4, " ");
    }

    // If more than 4 digits, show last 4 digits
    return numStr.slice(-4);
  };

  const Digit = ({ char }) => {
    const segments = digitSegments[char] || [
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ];
    const [a, b, c, d, e, f, g] = segments;

    return (
      <DigitContainer>
        <Segment className="horizontal top" active={a} />
        <Segment className="vertical top-right" active={b} />
        <Segment className="vertical bottom-right" active={c} />
        <Segment className="horizontal bottom" active={d} />
        <Segment className="vertical bottom-left" active={e} />
        <Segment className="vertical top-left" active={f} />
        <Segment className="horizontal middle" active={g} />
      </DigitContainer>
    );
  };

  useEffect(() => {
    // Fetch current question/answer on load
    fetchCurrentQuestion();

    // Connect to the WebSocket server
    const serverUrl = process.env.REACT_APP_SERVER_URL;

    // Convert HTTP URL to WebSocket URL
    let websocketUrl = serverUrl;
    if (
      !websocketUrl.startsWith("ws://") &&
      !websocketUrl.startsWith("wss://")
    ) {
      // Remove any existing http/https prefix
      websocketUrl = websocketUrl.replace(/^https?:\/\//, "");
      // Use wss for production, ws for localhost
      const protocol = websocketUrl.includes("localhost") ? "ws://" : "wss://";
      websocketUrl = protocol + websocketUrl;
    }

    const websocket = new WebSocket(websocketUrl);

    websocket.onopen = () => {
      // Connected to WebSocket server
    };

    websocket.onclose = (event) => {
      // If the connection was closed by the server (not by us), attempt to reconnect
      if (event.code !== 1000 && event.code !== 1001) {
        setTimeout(() => {
          // Create new connection by triggering this useEffect again would require state change
          // For now, just handle that we detected an unexpected disconnection
        }, 3000);
      }
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different message types
        if (data.type === "number-update" && data.number !== undefined) {
          setCurrentNumber(formatNumber(data.number));
        }
      } catch (error) {
        // Silently handle WebSocket message parsing errors
      }
    };

    websocket.onerror = (error) => {
      // Silently handle WebSocket connection errors
    };

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [fetchCurrentQuestion]);

  return (
    <Page>
      <DisplayContainer>
        {currentNumber.split("").map((char, index) => (
          <Digit key={index} char={char} />
        ))}
      </DisplayContainer>
    </Page>
  );
}

export default FrameSimulator;
