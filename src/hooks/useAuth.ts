"use client";

import { useState, useEffect, useCallback } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setState({
        user: data.authenticated ? data.user : null,
        isLoading: false,
        isAuthenticated: data.authenticated || false,
      });
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const register = async (email: string) => {
    // 1. Get registration options from server
    const beginRes = await fetch("/api/auth/register/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const beginData = await beginRes.json();
    if (!beginRes.ok) throw new Error(beginData.error);

    // 2. Create credential via browser WebAuthn API
    const credential = await startRegistration({ optionsJSON: beginData.options });

    // 3. Send credential to server for verification
    const completeRes = await fetch("/api/auth/register/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: beginData.userId, credential }),
    });

    const completeData = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeData.error);

    setState({
      user: completeData.user,
      isLoading: false,
      isAuthenticated: true,
    });

    return completeData;
  };

  const login = async (email: string) => {
    // 1. Get authentication options from server
    const beginRes = await fetch("/api/auth/login/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const beginData = await beginRes.json();
    if (!beginRes.ok) throw new Error(beginData.error);

    // 2. Authenticate via browser WebAuthn API
    const credential = await startAuthentication({ optionsJSON: beginData.options });

    // 3. Send credential to server for verification
    const completeRes = await fetch("/api/auth/login/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: beginData.userId, credential }),
    });

    const completeData = await completeRes.json();
    if (!completeRes.ok) throw new Error(completeData.error);

    setState({
      user: completeData.user,
      isLoading: false,
      isAuthenticated: true,
    });

    return completeData;
  };

  const loginWithPin = async (email: string, pin: string) => {
    const res = await fetch("/api/auth/pin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pin }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setState({
      user: data.user,
      isLoading: false,
      isAuthenticated: true,
    });

    return data;
  };

  const setPin = async (pin: string) => {
    const res = await fetch("/api/auth/pin/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    return data;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  return {
    ...state,
    register,
    login,
    loginWithPin,
    setPin,
    logout,
    checkSession,
  };
}

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = "/login";
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}
