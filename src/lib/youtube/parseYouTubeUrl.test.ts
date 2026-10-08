import { describe, expect, it } from 'vitest'
import { parseYouTubeInput, parseYouTubeUrl } from './parseYouTubeUrl'

const ID = 'Abc_def-123'

describe('parseYouTubeUrl', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`, ID],
    [`youtube.com/watch?v=${ID}`, ID],
    [`www.youtube.com/watch?v=${ID}&t=42&list=abc`, ID],
    [`https://youtube.com/watch?list=abc&v=${ID}`, ID],
    [`http://youtube.com/watch?v=${ID}`, ID],
    [`https://youtu.be/${ID}`, ID],
    [`youtu.be/${ID}?t=90`, ID],
    [`https://www.youtu.be/${ID}`, ID],
    [`https://youtube.com/embed/${ID}`, ID],
    [`youtube.com/embed/${ID}?start=10`, ID],
    [`https://youtube.com/shorts/${ID}`, ID],
    [`https://m.youtube.com/watch?v=${ID}`, ID],
    [`m.youtube.com/embed/${ID}`, ID],
    [`https://music.youtube.com/watch?v=${ID}`, ID],
    [`music.youtube.com/shorts/${ID}`, ID],
    [`  ${ID}  `, ID],
    [`  https://www.youtube.com/watch?v=${ID}  `, ID],
  ])('parses %s', (input, expected) => {
    expect(parseYouTubeUrl(input)).toBe(expected)
  })

  describe('parseYouTubeInput', () => {
    it.each([
      [`https://www.youtube.com/watch?v=${ID}&t=90`, 90],
      [`https://www.youtube.com/watch?v=${ID}&t=90s`, 90],
      [`https://www.youtube.com/watch?v=${ID}&t=1m30s`, 90],
      [`https://www.youtube.com/watch?v=${ID}&start=90`, 90],
      [`https://youtu.be/${ID}#t=90`, 90],
      [`https://youtu.be/${ID}?t=90`, 90],
      [ID, 0],
    ])('returns video and start time for %s', (input, startSeconds) => {
      expect(parseYouTubeInput(input)).toEqual({ videoId: ID, startSeconds })
    })

    it('keeps parseYouTubeUrl returning only the video ID', () => {
      expect(parseYouTubeUrl(`https://youtu.be/${ID}?t=1m30s`)).toBe(ID)
    })
  })

  it.each([
    '',
    'not a url',
    '1234567890',
    '123456789012',
    'javascript:alert(1)',
    'data:text/html,hello',
    'https://evil.com/watch?v=Abc_def-123',
    'https://youtube.com.evil.com/watch?v=Abc_def-123',
    'https://evil-youtube.com/watch?v=Abc_def-123',
    'https://youtube.com/watch?v=short',
    'https://youtube.com/watch',
    'https://youtube.com/watch?v=Abc_def-12!',
    'https://youtube.com/embed/',
    'https://youtube.com/shorts',
    'https://youtu.be/',
    'https://youtube.com.evil/watch?v=Abc_def-123',
    '//youtube.com/watch?v=Abc_def-123',
    'https://youtube.com@evil.com/watch?v=Abc_def-123',
    'https://youtube.com:443.evil.com/watch?v=Abc_def-123',
    'https://youtube.com/watch?v=Abc_def-123%0a',
    'https://youtube.com/playlist?list=Abc_def-123',
    'ftp://youtube.com/watch?v=Abc_def-123',
    'https://youtu.be/Abc_def-123/extra',
    'https://youtube.com/embed/Abc_def-123/extra',
    'https://youtube.com/watch?v=Abc_def-123#javascript:alert(1)',
  ])('rejects %s', (input) => {
    expect(parseYouTubeUrl(input)).toBeNull()
  })
})
