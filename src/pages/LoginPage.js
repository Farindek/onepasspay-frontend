import React, { useState } from "react";
import axios from "axios";

function LoginPage({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:8000/auth/login", {
      email,
      password,
    });
    console.log("Login Success:", response.data);
    setToken(response.data.access_token);
    alert("Login Successful!");
  } catch (error) {
    console.error("Login Error Details:", error.response);
    alert("Login Failed: " + (error.response?.data?.detail || error.message));
  }
};

  return (
    <div>
      <h1>OnePassPay Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
