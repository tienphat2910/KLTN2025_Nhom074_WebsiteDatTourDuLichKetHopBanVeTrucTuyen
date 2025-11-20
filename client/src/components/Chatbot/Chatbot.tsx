"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, Trash2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import chatbotService, { SuggestedItem } from "@/services/chatbotService";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestedItems?: SuggestedItem[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Xin chao! Toi la tro ly AI cua LuTrip. Toi co the giup ban:\n\nTim tour du lich phu hop\nTu van diem den\nHuong dan dat cho va thanh toan\nTra loi cac cau hoi ve du lich\n\nBan can ho tro gi?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load lịch sử chat khi mở chatbot
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const history = await chatbotService.getChatHistory();
      if (history.length > 0) {
        const loadedMessages: Message[] = history.map((msg, idx) => ({
          id: `history_${idx}`,
          text: msg.content,
          isBot: msg.role === "assistant",
          timestamp: new Date(msg.timestamp)
        }));
        // Chỉ thêm lịch sử nếu có, giữ welcome message
        setMessages([messages[0], ...loadedMessages]);
      }
    } catch (error) {
      // Error loading history
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(text, user?._id);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isBot: true,
        timestamp: new Date(response.timestamp),
        suggestedItems: response.suggestedItems
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          error.message ||
          "Xin loi, co loi xay ra. Vui long thu lai sau hoac lien he hotline 1900 XXX XXX.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleClearHistory = async () => {
    if (!confirm("Bạn có chắc muốn xóa lịch sử chat?")) return;

    try {
      await chatbotService.clearHistory();
      setMessages([
        {
          id: "1",
          text: "Lich su da duoc xoa. Ban co the bat dau cuoc tro chuyen moi!",
          isBot: true,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      alert("Không thể xóa lịch sử. Vui lòng thử lại.");
    }
  };

  const quickQuestions = [
    "Tour Phú Quốc 3 ngày 2 đêm",
    "Cách đặt tour trên LuTrip?",
    "Chính sách hủy tour",
    "Ưu đãi hiện tại"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const handleItemClick = (item: SuggestedItem) => {
    setIsOpen(false); // Đóng chatbot

    // Navigate dựa trên type
    switch (item.type) {
      case "tour":
        if (item.slug) {
          router.push(`/tours/detail/${item.slug}`);
        } else {
          router.push(`/tours/${item.id}`);
        }
        break;
      case "destination":
        router.push(`/destinations/${item.id}`);
        break;
      case "activity":
        router.push(`/activity/${item.id}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-sky-500 hover:bg-sky-600 text-white p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="Mở chatbot"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <X size={24} className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <div className="relative">
            <img
              src="https://res.cloudinary.com/de5rurcwt/image/upload/v1763665514/img.icons8.com_zdd0ju.png"
              alt="Chatbot"
              className="w-6 h-6 md:w-7 md:h-7 object-contain"
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
          </div>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className="pointer-events-auto fixed inset-x-0 bottom-0 md:bottom-20 md:right-6 md:left-auto w-full md:max-w-md h-[100dvh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col animate-slide-up border-t md:border border-gray-200"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="bg-sky-500 text-white p-3 md:p-4 md:rounded-t-2xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center p-1">
                <img
                  src="https://res.cloudinary.com/de5rurcwt/image/upload/v1763665514/img.icons8.com_zdd0ju.png"
                  alt="LuTrip Assistant"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">
                  LuTrip Assistant
                </h3>
                <p className="text-xs opacity-90 hidden md:block">
                  Hỗ trợ 24/7 • Powered by Gemini AI
                </p>
                <p className="text-[10px] md:hidden opacity-90">Hỗ trợ 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Xóa lịch sử chat"
              >
                <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 md:hidden hover:bg-white/20 rounded-lg transition-colors"
                title="Đóng chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[85%] ${
                    message.isBot ? "order-1" : "order-2"
                  }`}
                >
                  <div
                    className={`p-2.5 md:p-3 rounded-2xl shadow-sm ${
                      message.isBot
                        ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                        : "bg-sky-500 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>

                    {/* Suggested Items */}
                    {message.suggestedItems &&
                      message.suggestedItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Gợi ý cho bạn:
                          </p>
                          <div className="grid gap-2">
                            {message.suggestedItems.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleItemClick(item)}
                                className="bg-gray-50 hover:bg-gray-100 p-2 rounded-lg cursor-pointer transition-colors border border-gray-200"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                    {item.type === "tour" && (
                                      <span className="text-xs">Tour</span>
                                    )}
                                    {item.type === "destination" && (
                                      <span className="text-xs">Diem den</span>
                                    )}
                                    {item.type === "activity" && (
                                      <span className="text-xs">Hoat dong</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">
                                      {item.title}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  <span className="text-[10px] md:text-xs text-gray-500 mt-1 block px-2">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-sky-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-3 md:px-4 py-2 bg-white border-t border-gray-100 shrink-0">
              <p className="text-[10px] md:text-xs text-gray-500 mb-2">
                Câu hỏi gợi ý:
              </p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-[10px] md:text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 md:px-3 py-1 md:py-1.5 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 md:p-4 bg-white border-t border-gray-200 md:rounded-b-2xl shrink-0 safe-area-bottom"
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-gray-400 text-white p-2.5 md:p-3 rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg"
              >
                <Send size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
