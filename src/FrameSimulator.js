import React, { useState, useEffect } from "react";
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

const Segment = styled.div`
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
      console.log("Connected to WebSocket server");
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        // Handle different message types
        if (data.type === "number-update" && data.number !== undefined) {
          setCurrentNumber(formatNumber(data.number));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
    };

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, []);

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
