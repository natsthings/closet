"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function AuthGate({ children }) {
  const supabase = createClient();
  const [session, setSession] = useState(undefined); // undefined = loading
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="chrome-font text-2xl">loading closet.exe ...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="win w-full max-w-sm">
          <div className="win-titlebar">
            <span className="win-dot" style={{ background: "#ff6161" }} />
            <span className="win-dot" style={{ background: "#ffd166" }} />
            <span className="win-dot" style={{ background: "#8ee08e" }} />
            <div className="win-addressbar">closet://{mode === "signin" ? "sign-in" : "sign-up"}</div>
          </div>
          <div className="p-6">
            <h1 className="display text-2xl font-bold mb-1">closet.exe</h1>
            <p className="text-sm text-[var(--ink-soft)] mb-5">
              your wardrobe, wishlist &amp; window-shopping — all in one browser.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1"
                  placeholder="you@school.edu"
                />
              </label>
              <label className="text-sm font-medium">
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1"
                  placeholder="••••••••"
                />
              </label>

              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              {notice && <p className="text-sm text-green-700">{notice}</p>}

              <button type="submit" disabled={busy} className="btn btn-accent mt-2 w-full">
                {busy ? "one sec..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              className="text-sm underline mt-4 text-[var(--ink-soft)]"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setNotice("");
              }}
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
