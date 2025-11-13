// src/components/SignInBar.tsx
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  type User
} from "firebase/auth";
import { auth, provider } from "../firebase";

export function SignInBar() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u: User | null) => {
    setUser(u);
    setError(null);
    setInfo(null);
    if (u) setOpen(false);
  });
  return unsub;
}, []);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (e: any) {
      setError(e?.message ?? "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const onForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent. Please check your inbox.");
    } catch (e: any) {
      setError(e?.message ?? "Failed to send reset email.");
    }
  };

  // Logged in → small pill in header
  if (user) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.7)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}
      >
        <span
          style={{
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {user.email}
        </span>
        <button
          onClick={() => signOut(auth)}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
            background: "linear-gradient(135deg,#ff7aa2,#ffb86c)",
            color: "#fff",
            fontWeight: 600
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  // Not logged in → header button + centered popup
  return (
    <>
      {/* BUTTON IN HEADER (aligned to right via CSS wrapper) */}
      <button
        type="button"
        className="storygift-signin-btn"
        onClick={() => setOpen(true)}
      >
        Sign in
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.38)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",   // start + paddingTop to move it down
            paddingTop: "140px",
            zIndex: 200
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: 20,
              width: "90%",
              maxWidth: 380,
              boxShadow: "0 12px 32px rgba(0,0,0,0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 12,
                fontSize: 18,
                textAlign: "center"
              }}
            >
              {mode === "login" ? "Sign in to StoryGift" : "Create your StoryGift account"}
            </h3>

            <input
              type="email"
              placeholder="Email"
              style={{
                width: "90%",
                padding: "8px 12px",
                marginBottom: 8,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 13
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              style={{
                width: "90%",
                padding: "8px 12px",
                marginBottom: 8,
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 13
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={onSubmit}
              disabled={busy}
              style={{
                width: "97%",
                padding: "9px 12px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#ff7aa2,#ffb86c)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: busy ? "default" : "pointer",
                marginBottom: 6
              }}
            >
              {busy ? "…" : mode === "signup" ? "Sign up" : "Log in"}
            </button>

            <button
              type="button"
              onClick={onForgotPassword}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 10,
                border: "none",
                fontSize: 12,
                cursor: "pointer",
                background: "transparent",
                textDecoration: "underline",
                marginBottom: 8
              }}
            >
              Forgot password?
            </button>

            <button
              type="button"
              onClick={() => signInWithPopup(auth, provider)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                fontSize: 12,
                cursor: "pointer",
                background: "#fafafa",
                marginBottom: 8
              }}
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                fontSize: 12,
                cursor: "pointer"
              }}
            >
              {mode === "login"
                ? "New here? Create account"
                : "Already have an account? Log in"}
            </button>

            {error && (
              <div style={{ color: "#c00", fontSize: 12, marginTop: 6 }}>{error}</div>
            )}
            {info && (
              <div style={{ color: "green", fontSize: 12, marginTop: 4 }}>{info}</div>
            )}

            <div
              style={{
                marginTop: 10,
                textAlign: "center",
                fontSize: 12,
                cursor: "pointer",
                opacity: 0.7
              }}
              onClick={() => setOpen(false)}
            >
              Close
            </div>
          </div>
        </div>
      )}
    </>
  );
}