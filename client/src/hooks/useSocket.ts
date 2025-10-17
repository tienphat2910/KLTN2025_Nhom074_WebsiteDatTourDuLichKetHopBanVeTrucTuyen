import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  useEffect(() => {
    // Check initial connection status
    setIsConnected(socketService.isConnected());
    setSocketId(socketService.getSocketId());

    // Listen for connection changes
    const handleConnected = () => {
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setSocketId(undefined);
    };

    socketService.on("connected", handleConnected);
    socketService.on("disconnected", handleDisconnected);

    // Cleanup
    return () => {
      socketService.off("connected", handleConnected);
      socketService.off("disconnected", handleDisconnected);
    };
  }, []);

  return {
    isConnected,
    socketId,
    socketService
  };
}
