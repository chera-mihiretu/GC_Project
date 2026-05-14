"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket, disconnectSocket, type TypedSocket } from "@/lib/socket-client";

export function useSocket() {
  const socketRef = useRef<TypedSocket>(getSocket());
  const [connected, setConnected] = useState(() => socketRef.current.connected);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const socket = socketRef.current;

    function onConnect() {
      setConnected(true);
      setReconnecting(false);
    }

    function onDisconnect(reason: string) {
      setConnected(false);
      if (reason === "io server disconnect") {
        // Server kicked us — reconnect manually after a delay
        setTimeout(() => { if (!socket.connected) socket.connect(); }, 2000);
      }
    }

    function onReconnectAttempt() {
      setReconnecting(true);
    }

    function onReconnectFailed() {
      setReconnecting(false);
    }

    function onConnectError() {
      setConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.io.on("reconnect", onConnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.io.off("reconnect", onConnect);
    };
  }, []);

  return { socket: socketRef.current, connected, reconnecting };
}
