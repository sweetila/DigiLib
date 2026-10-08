import { describe, expect, it } from 'vitest'
import { addRecentBackground, type RecentYouTubeBackground } from './recentBackgrounds'

const recent = (videoId: string, addedAt: number): RecentYouTubeBackground => ({
  videoId,
  url: `https://youtu.be/${videoId}`,
  addedAt,
})

describe('addRecentBackground', () => {
  it('moves duplicates to the front, updates their URL, and keeps their title', () => {
    const previous = { ...recent('video00001', 1), title: 'Saved title' }
    expect(addRecentBackground([previous, recent('video00002', 2)], recent('video00001', 3))).toEqual([
      { ...recent('video00001', 3), title: 'Saved title' },
      recent('video00002', 2),
    ])
  })

  it('keeps newest-first ordering and limits the list to eight entries', () => {
    const recents = Array.from({ length: 8 }, (_, index) =>
      recent(`video${String(7 - index).padStart(6, '0')}`, 7 - index),
    )
    const next = addRecentBackground(recents, recent('newest00001', 9))
    expect(next).toHaveLength(8)
    expect(next.map((item) => item.videoId)).toEqual([
      'newest00001',
      'video000007',
      'video000006',
      'video000005',
      'video000004',
      'video000003',
      'video000002',
      'video000001',
    ])
  })
})
