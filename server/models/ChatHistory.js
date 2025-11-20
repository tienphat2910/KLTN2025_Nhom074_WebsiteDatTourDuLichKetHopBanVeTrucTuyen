const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        sessionId: {
            type: String,
            required: true,
            index: true,
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ["user", "assistant"],
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        metadata: {
            tourContext: String,
            destinationContext: String,
            lastActivity: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh
chatHistorySchema.index({ sessionId: 1, updatedAt: -1 });

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
