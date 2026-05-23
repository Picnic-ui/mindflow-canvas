import http from 'http'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../app.js'
import { attachWebSocketServer } from '../ws/server.js'

describe('api 1.0.0', () => {
  let server: http.Server

  beforeAll(async () => {
    server = http.createServer(app)
    attachWebSocketServer(server)
    await new Promise<void>((resolve) => server.listen(0, resolve))
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('creates guest session', async () => {
    const res = await request(server).post('/v1/guest/session').send({ nickname: '测试' })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.data.token).toBeTypeOf('string')
    expect(res.body.data.userId).toBeTypeOf('string')
  })

  it('creates room and renders poster', async () => {
    const sessionRes = await request(server).post('/v1/guest/session').send({ nickname: 'A' })
    const token = sessionRes.body.data.token as string

    const roomRes = await request(server)
      .post('/v1/rooms')
      .set('authorization', `Bearer ${token}`)
      .send({ theme: '春日植物', maxPlayers: 8 })
    expect(roomRes.status).toBe(200)
    expect(roomRes.body.ok).toBe(true)
    expect(roomRes.body.data.roomId).toBeTypeOf('string')

    const posterRes = await request(server)
      .post('/v1/posters/render')
      .set('authorization', `Bearer ${token}`)
      .send({ type: 'art', payload: { prompt: 'x' } })
    expect(posterRes.status).toBe(200)
    expect(posterRes.body.ok).toBe(true)
    expect(posterRes.body.data.assetId).toBeTypeOf('string')

    const assetId = posterRes.body.data.assetId as string
    const assetRes = await request(server).get(`/v1/assets/${assetId}`)
    expect(assetRes.status).toBe(200)
    expect(assetRes.body.ok).toBe(true)
    expect(assetRes.body.data.type).toBe('art')
  })
})

