import React, { useState, useEffect } from "react";
import { scorePassword } from "./utils/passwordScoring";
import { breachChecker } from "./utils/breachChecker";

// Parse diceware wordlist (EFF format: "12345\tword")
function parseDicewareWordlist(text) {
  return text.split('\n')
    .map(line => {
      const parts = line.trim().split(/\s+/);
      return parts[1];
    })
    .filter(Boolean);
}

// Passphrase generator
function generatePassphrase(wordlist, numWords = 5) {
  let out = [];
  for (let i = 0; i < numWords; ++i) {
    out.push(wordlist[Math.floor(Math.random() * wordlist.length)]);
  }
  return out.join("-");
}

// Crack time estimation (rough, GPU attack)
function crackTime(entropy) {
  const guesses = Math.pow(2, entropy);
  const guessesPerSecond = 1e10;
  const seconds = guesses / guessesPerSecond;
  if (seconds < 60) return "< 1 minute";
  if (seconds < 3600) return `${Math.round(seconds/60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds/3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds/86400)} days`;
  if (seconds < 3153600000) return `${Math.round(seconds/31536000)} years`;
  return "> 100 years";
}

export default function App() {
  const [pw, setPw] = useState("");
  const [result, setResult] = useState(null);
  const [dict, setDict] = useState([]);
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const [diceware, setDiceware] = useState([]);

  // Load blacklist and diceware wordlist
  useEffect(() => {
    fetch("/top-10k-passwords.txt")
      .then(r => r.text())
      .then(txt => setDict(txt.split('\n')));
    fetch("/diceware-en.txt")
      .then(r => r.text())
      .then(txt => setDiceware(parseDicewareWordlist(txt)));
  }, []);

  // Score password and check breach
  useEffect(() => {
    let isCurrent = true;
    async function check() {
      if (!pw) { setResult(null); setChecking(false); return; }
      setChecking(true);
      const res = await scorePassword(pw, dict, [], breachChecker);
      if (isCurrent) setResult(res);
      setChecking(false);
    }
    check();
    return () => { isCurrent = false; };
    // eslint-disable-next-line
  }, [pw, dict]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pw);
  };

  const handleGenerate = () => {
    if (diceware.length === 0) return;
    const newPw = generatePassphrase(diceware, 5);
    setPw(newPw);
  };

  const handleClear = () => {
    setPw("");
    setResult(null);
  };

  return (
    <div style={{
      maxWidth: 440, margin: "2rem auto", padding: "2rem",
      background: "#181818", borderRadius: 16, color: "#fff", boxShadow: "0 2px 16px #0005"
    }}>
      <h2>Password Strength Checker</h2>
      <label htmlFor="pw" style={{ fontWeight: 500, marginTop: 8 }}>Password:</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          id="pw"
          type={show ? "text" : "password"}
          value={pw}
          onChange={e => setPw(e.target.value)}
          style={{
            width: "100%", padding: "10px", fontSize: 18, borderRadius: 8,
            marginTop: 8, marginBottom: 8, background: "#222", color: "#fff"
          }}
          autoComplete="off"
          aria-label="Password"
        />
        <button
          onClick={() => setShow(v => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            background: "#333", border: "none", color: "#fff", borderRadius: 8,
            padding: "8px 12px", cursor: "pointer"
          }}
        >{show ? "🙈" : "👁️"}</button>
        <button
          onClick={handleCopy}
          aria-label="Copy password"
          disabled={!pw}
          style={{
            background: "#333", border: "none", color: "#fff", borderRadius: 8,
            padding: "8px 12px", cursor: pw ? "pointer" : "not-allowed"
          }}
        >📋</button>
        <button
          onClick={handleClear}
          aria-label="Clear password"
          disabled={!pw}
          style={{
            background: "#333", border: "none", color: "#fff", borderRadius: 8,
            padding: "8px 12px", cursor: pw ? "pointer" : "not-allowed"
          }}
        >✖️</button>
      </div>

      <button
        onClick={handleGenerate}
        style={{
          width: "100%", margin: "12px 0", background: "#1e40af", color: "#fff",
          border: "none", padding: "10px", borderRadius: 8, fontSize: 16, fontWeight: 500, cursor: "pointer"
        }}
        disabled={diceware.length === 0}
      >Generate Secure Passphrase</button>

      {checking && (
        <div style={{ marginTop: 10, color: "#fbbf24" }}>Checking breach database...</div>
      )}
      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: "bold" }}>
            Strength: <span>
              {result.strength}
              {" "}
              {result.score > 5 ? "🟢" : result.score > 3 ? "🟡" : "🔴"}
            </span>
          </div>
          <div style={{ background: "#333", borderRadius: 8, marginTop: 8, height: 8, width: "100%" }}>
            <div
              style={{
                width: `${result.score * 12.5}%`,
                height: 8,
                borderRadius: 8,
                background: result.score > 5 ? "#16a34a" : result.score > 3 ? "#fbbf24" : "#dc2626"
              }}
            />
          </div>
          <div style={{ marginTop: 8 }}>Entropy: {result.entropy}</div>
          <div style={{ marginTop: 8 }}>Estimated Crack Time: {crackTime(Number(result.entropy))}</div>
          <ul style={{ marginTop: 8 }}>
            {result.feedback.map((msg, i) => (
              <li key={i} style={{ color: '#f87171', fontSize: 14 }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 24, fontSize: 12, color: "#aaa" }}>
        No passwords are stored. Checks are client-side and privacy-preserving.<br />
        Passphrase wordlist: EFF Large (diceware) List.<br />
        <a href="https://www.eff.org/dice" target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8" }}>About Passphrases</a>
      </div>
    </div>
  );
}
