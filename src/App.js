import React, { useState } from "react";
import "./App.css";

function App() {
  const [cardNumber, setCardNumber] = useState("4111 1234 5678 9101");
  const [merchant, setMerchant] = useState("Amazon");
  const [logs, setLogs] = useState([]);

  const generateCard = () => {
    const randomCard = "4111 " + Array(3).fill(0).map(() => Math.floor(1000 + Math.random() * 9000)).join(" ");
    setCardNumber(randomCard);
    const logEntry = `Card generated for ${merchant} - ${new Date().toLocaleTimeString()}`;
    setLogs([logEntry, ...logs]);
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1>OnePassPay</h1>
        <p style={{ fontStyle: "italic", marginBottom: "30px" }}>
          Secure One-Time Payment Cards For Every Transaction
        </p>

        <select value={merchant} onChange={(e) => setMerchant(e.target.value)} style={inputStyle}>
          <option>Amazon</option>
          <option>Netflix</option>
          <option>Uber</option>
          <option>Spotify</option>
        </select><br />

        <button onClick={generateCard} style={buttonStyle}>Generate Virtual Card</button>

        <div style={cardStyle}>
          <h3>{merchant} One-Time Virtual Card</h3>
          <p style={{ fontSize: "22px", letterSpacing: "2px" }}>{cardNumber}</p>
          <p>Expires in: 10 minutes</p>
        </div>

        <div style={{ textAlign: "left", marginTop: "20px", color: "#ccc" }}>
          <h4>Transaction Log</h4>
          {logs.map((log, index) => (
            <p key={index} style={{ margin: "5px 0" }}>{log}</p>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{
        marginTop: "30px",
        padding: "10px",
        color: "#ddd",
        fontSize: "12px",
        textAlign: "center",
        maxWidth: "400px"
      }}>
        This is a secure prototype deployed for demonstration purposes only. 
        In a production environment, this system would be fully secured with PCI DSS compliance, HTTPS encryption, and cloud-based infrastructure to support real financial transactions.
      </p>

      {/* Footer */}
      <footer style={{
        marginTop: "40px",
        padding: "20px",
        color: "#ddd",
        fontSize: "12px",
        textAlign: "center"
      }}>
        <p>© 2025 OnePassPay. All rights reserved.</p>
        <p>
          <a href="#" style={{ color: "#ddd", textDecoration: "underline" }}>Privacy Policy</a> | 
          <a href="#" style={{ color: "#ddd", textDecoration: "underline", marginLeft: "5px" }}>Contact Us</a>
        </p>
      </footer>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #6a11cb, #2575fc)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const containerStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "16px",
  padding: "40px",
  width: "90%",
  maxWidth: "400px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.37)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.18)",
  textAlign: "center"
};

const inputStyle = {
  padding: "10px",
  width: "100%",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "none",
  outline: "none",
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#8e2de2",
  color: "white",
  cursor: "pointer",
  marginTop: "10px"
};

const cardStyle = {
  background: "linear-gradient(135deg, #8e2de2, #4a00e0)",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  color: "white",
  marginTop: "20px"
};

export default App;
