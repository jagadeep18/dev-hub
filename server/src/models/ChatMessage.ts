import mongoose, { Schema, Document } from 'mongoose'

export interface IChatMessage extends Document {
	roomId: string
	message: string
	username: string
	timestamp: Date
	createdAt: Date
	updatedAt: Date
}

const ChatMessageSchema = new Schema({
	roomId: { type: String, required: true },
	message: { type: String, required: true },
	username: { type: String, required: true },
	timestamp: { type: Date, default: Date.now }
}, {
	timestamps: true
})

// Index for efficient queries
ChatMessageSchema.index({ roomId: 1, timestamp: -1 })

const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema)

export default ChatMessageModel