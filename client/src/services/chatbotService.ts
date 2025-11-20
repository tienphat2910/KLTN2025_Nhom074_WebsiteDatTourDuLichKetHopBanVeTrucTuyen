import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SuggestedItem {
  type: "tour" | "destination" | "activity";
  id: string;
  slug?: string;
  title: string;
  description?: string;
  price?: number;
  duration?: string;
  destination?: string;
  image?: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: Date;
  suggestedItems?: SuggestedItem[];
}

export interface TourSuggestion {
  suggestions: string;
  tours: any[];
}

class ChatbotService {
  private sessionId: string;

  constructor() {
    // Tạo hoặc lấy session ID từ localStorage
    if (typeof window !== "undefined") {
      let savedSessionId = localStorage.getItem("chatbot_session_id");
      if (!savedSessionId) {
        savedSessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;
        localStorage.setItem("chatbot_session_id", savedSessionId);
      }
      this.sessionId = savedSessionId;
    } else {
      this.sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}`;
    }
  }

  async sendMessage(message: string, userId?: string): Promise<ChatResponse> {
    try {
      const response = await axios.post(`${API_URL}/chatbot/chat`, {
        message,
        sessionId: this.sessionId,
        userId
      });
      return response.data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw new Error(error.response?.data?.error || "Không thể gửi tin nhắn");
    }
  }

  async suggestTours(query: string): Promise<TourSuggestion> {
    try {
      const response = await axios.post(`${API_URL}/chatbot/suggest-tours`, {
        query,
        sessionId: this.sessionId
      });
      return response.data;
    } catch (error: any) {
      console.error("Error suggesting tours:", error);
      throw new Error(error.response?.data?.error || "Không thể gợi ý tour");
    }
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const response = await axios.get(
        `${API_URL}/chatbot/history/${this.sessionId}`
      );
      return response.data.messages || [];
    } catch (error: any) {
      console.error("Error getting chat history:", error);
      return [];
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await axios.delete(`${API_URL}/chatbot/clear/${this.sessionId}`);
      // Tạo session ID mới
      if (typeof window !== "undefined") {
        const newSessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;
        localStorage.setItem("chatbot_session_id", newSessionId);
        this.sessionId = newSessionId;
      }
    } catch (error: any) {
      console.error("Error clearing history:", error);
      throw new Error(error.response?.data?.error || "Không thể xóa lịch sử");
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export default new ChatbotService();
