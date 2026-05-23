import crypto from 'crypto'

export type AssetType = 'art' | 'story' | 'nature'

export type Asset = {
  id: string
  type: AssetType
  ownerId: string
  createdAt: number
  payload: unknown
}

const assetsById = new Map<string, Asset>()

export function createAsset(params: { type: AssetType; ownerId: string; payload: unknown }): Asset {
  const asset: Asset = {
    id: crypto.randomUUID(),
    type: params.type,
    ownerId: params.ownerId,
    createdAt: Date.now(),
    payload: params.payload,
  }
  assetsById.set(asset.id, asset)
  return asset
}

export function getAsset(assetId: string): Asset | undefined {
  return assetsById.get(assetId)
}

