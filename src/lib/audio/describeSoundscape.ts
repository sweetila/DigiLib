import { AUDIO_SOURCE_IDS, type AudioSourceId } from './sources'

const sourceNames: Record<AudioSourceId, string> = {
  rain: 'Rain',
  ocean: 'Ocean',
  cafe: 'Café',
  white: 'White Noise',
  brown: 'Brown Noise',
  delta: 'Delta',
  theta: 'Theta',
  wind: 'Wind',
}

export function describeSoundscape(
  playing: Readonly<Record<AudioSourceId, boolean>>,
  youtubeAudio: { url: string; videoId: string } | null,
): string | null {
  const names = AUDIO_SOURCE_IDS.filter((id) => playing[id]).map((id) => sourceNames[id])
  if (youtubeAudio) names.push('YouTube Music')
  return names.length ? names.join(' + ') : null
}
