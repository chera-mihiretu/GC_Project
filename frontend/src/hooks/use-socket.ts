"use client";

import { useEffect, useState } from "react";
import { getSocket, disconnectSocket, type TypedSocket } from "@/lib/socket-client";

export function useSocket() {
  const [socket] = useState<TypedSocket>(() => getSocket());
  const [connected, setConnected] = useState(() => socket.connected);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
    };
  }, [socket]);

  return { socket, connected };
}
