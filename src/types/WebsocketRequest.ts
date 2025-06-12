// src/types/WebsocketRequest.ts
import { z } from 'zod'

export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SendMessage'),
    receiver: z.number(),
    message: z.string()
  }),
  z.object({
    type: z.literal('SendGroupMessage'),
    group_id: z.number(),
    message: z.string()
  })
])

export type ClientMessage = z.infer<typeof ClientMessageSchema>
