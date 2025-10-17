// import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";

// Mock socket types for when socket.io-client is not available
interface MockSocket {
  connected: boolean;
  id?: string;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  connect: () => void;
  disconnect: () => void;
}

class SocketService {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isUsingMock = false;

  // Event listeners
  private listeners: { [event: string]: Function[] } = {};

  async connect(token?: string) {
    try {
      // Try to dynamically import socket.io-client
      const { io } = await import("socket.io-client");
      const socketUrl = env.API_BASE_URL.replace("/api", "");

      this.socket = io(socketUrl, {
        auth: {
          token:
            token ||
            localStorage.getItem("lutrip_admin_token") ||
            localStorage.getItem("lutrip_token")
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true
      });

      this.isUsingMock = false;
      this.setupEventListeners();
      this.setupReconnection();
      console.log("Real Socket.IO client connected");
    } catch (error) {
      console.warn("Socket.IO client not available, using mock socket:", error);
      this.socket = this.createMockSocket();
      this.isUsingMock = true;
    }
  }

  private createMockSocket() {
    return {
      connected: false,
      on: (event: string, callback: Function) => {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      },
      off: (event: string, callback?: Function) => {
        if (!this.listeners[event]) return;

        if (callback) {
          this.listeners[event] = this.listeners[event].filter(
            (cb) => cb !== callback
          );
        } else {
          delete this.listeners[event];
        }
      },
      emit: (event: string, ...args: any[]) => {
        console.log("Mock socket emit:", event, args);
      },
      connect: () => {
        console.log("Mock socket connect");
      },
      disconnect: () => {
        console.log("Mock socket disconnect");
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = {};
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit("connected");
    });

    this.socket.on("disconnect", (reason: any) => {
      console.log("Socket disconnected:", reason);
      this.emit("disconnected", reason);
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
      this.emit("connection_error", error);
    });

    // Admin specific events
    this.socket.on("user_registered", (data: any) => {
      this.emit("user_registered", data);
    });

    this.socket.on("booking_created", (data: any) => {
      this.emit("booking_created", data);
    });

    this.socket.on("payment_completed", (data: any) => {
      this.emit("payment_completed", data);
    });

    this.socket.on("user_status_changed", (data: any) => {
      this.emit("user_status_changed", data);
    });

    this.socket.on("new_notification", (data: any) => {
      this.emit("new_notification", data);
    });

    this.socket.on("system_alert", (data: any) => {
      this.emit("system_alert", data);
    });
  }

  private setupReconnection() {
    if (!this.socket) return;

    this.socket.on("disconnect", () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          console.log(
            `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    } else {
      delete this.listeners[event];
    }
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  // Send events to server
  emitToServer(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit:", event);
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Join admin room
  joinAdminRoom() {
    this.emitToServer("join_admin_room");
  }

  // Leave admin room
  leaveAdminRoom() {
    this.emitToServer("leave_admin_room");
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.emitToServer("send_notification", { userId, notification });
  }

  // Broadcast system message
  broadcastSystemMessage(
    message: string,
    type: "info" | "warning" | "error" = "info"
  ) {
    this.emitToServer("broadcast_system_message", { message, type });
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;
