import { useEffect, useState, useCallback } from "react";
import socketio from "socket.io-client";

export const useSocket = (
  uri: string,
  opts?: SocketIOClient.ConnectOpts
): any[] => {
  const [ws, setWs] = useState<SocketIOClient.Socket>();

  const initSocketIO = useCallback(() => {
    const socket = socketio("");
    setWs(socket);
  }, []);

  useEffect(initSocketIO, []);

  return [ws];
};

export default useSocket;
