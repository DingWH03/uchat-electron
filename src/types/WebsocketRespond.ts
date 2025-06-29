// src/types/WebsocketRespond.ts
import { z } from 'zod'

export const ServerMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SendMessage'),
    sender: z.number(),
    message: z.string(),
    timestamp: z.number()
  }),
  z.object({
    type: z.literal('SendGroupMessage'),
    sender: z.number(),
    group_id: z.number(),
    message: z.string(),
    timestamp: z.number()
  }),
  z.object({
    type: z.literal('OnlineMessage'),
    friend_id: z.number()
  }),
  z.object({
    type: z.literal('OfflineMessage'),
    friend_id: z.number()
  })
])

export type ServerMessage = z.infer<typeof ServerMessageSchema>
