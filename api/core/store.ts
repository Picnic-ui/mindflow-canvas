import crypto from 'crypto'

export type User = {
  id: string
  nickname: string
  avatarUrl: string
  createdAt: number
}

export type RoomStatus = 'lobby' | 'playing' | 'ended'

export type Room = {
  id: string
  theme: string
  status: RoomStatus
  maxPlayers: number
  inviteCode: string
  creatorId: string
  createdAt: number
  memberIds: Set<string>
}

export type MatchmakingState = {
  pendingRoomIdByTheme: Map<string, string>
}

const usersById = new Map<string, User>()
const tokensToUserId = new Map<string, string>()
const roomsById = new Map<string, Room>()
const matchmaking: MatchmakingState = {
  pendingRoomIdByTheme: new Map(),
}

export const store = {
  usersById,
  tokensToUserId,
  roomsById,
  matchmaking,
}

export function createInviteCode(): string {
  return crypto.randomBytes(4).toString('hex')
}

export function createToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

export function createUser(params: { nickname: string; avatarUrl: string }): User {
  const user: User = {
    id: crypto.randomUUID(),
    nickname: params.nickname,
    avatarUrl: params.avatarUrl,
    createdAt: Date.now(),
  }
  usersById.set(user.id, user)
  return user
}

export function createGuestSession(params: {
  nickname: string
  avatarUrl: string
}): { user: User; token: string } {
  const user = createUser(params)
  const token = createToken()
  tokensToUserId.set(token, user.id)
  return { user, token }
}

export function getUserIdByToken(token: string): string | undefined {
  return tokensToUserId.get(token)
}

export function getUserById(userId: string): User | undefined {
  return usersById.get(userId)
}

export function createRoom(params: {
  theme: string
  maxPlayers: number
  creatorId: string
}): Room {
  const room: Room = {
    id: crypto.randomUUID(),
    theme: params.theme,
    status: 'lobby',
    maxPlayers: params.maxPlayers,
    inviteCode: createInviteCode(),
    creatorId: params.creatorId,
    createdAt: Date.now(),
    memberIds: new Set([params.creatorId]),
  }
  roomsById.set(room.id, room)
  return room
}

export function getRoomById(roomId: string): Room | undefined {
  return roomsById.get(roomId)
}

export function joinRoom(params: { roomId: string; userId: string }): Room {
  const room = getRoomById(params.roomId)
  if (!room) {
    throw new Error('ROOM_NOT_FOUND')
  }
  if (room.memberIds.has(params.userId)) {
    return room
  }
  if (room.memberIds.size >= room.maxPlayers) {
    throw new Error('ROOM_FULL')
  }
  room.memberIds.add(params.userId)
  return room
}

export function removeFromRoom(params: { roomId: string; userId: string }): Room {
  const room = getRoomById(params.roomId)
  if (!room) {
    throw new Error('ROOM_NOT_FOUND')
  }
  room.memberIds.delete(params.userId)
  return room
}
