import mongoose, { Schema, Document } from 'mongoose'

export interface IRoom extends Document {
	roomId: string
	name?: string
	fileStructure: any // FileSystemItem structure
	createdAt: Date
	updatedAt: Date
}

const RoomSchema = new Schema({
	roomId: { type: String, required: true, unique: true },
	name: { type: String },
	fileStructure: { type: Schema.Types.Mixed, default: null }
}, {
	timestamps: true
})

const RoomModel = mongoose.models.Room || mongoose.model('Room', RoomSchema)

export default RoomModel