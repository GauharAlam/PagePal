// content/youtube_extractor.js
// Extracts YouTube transcripts via the timedtext API

export async function getYouTubeTranscript(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`
    );

    if (!res.ok) {
      throw new Error(`Timedtext API returned ${res.status}`);
    }

    const data = await res.json();
    const lines = data.events
      ?.filter(e => e.segs)
      .map(e => ({
        text: e.segs.map(s => s.utf8).join('').trim(),
        startMs: e.tStartMs,
        durationMs: e.dDurationMs
      }))
      .filter(l => l.text);

    return lines;
  } catch (err) {
    console.warn('YouTube transcript extraction failed:', err.message);

    // Fallback: try scraping captions from DOM
    try {
      const tracks = document.querySelectorAll('track[kind="captions"]');
      if (tracks.length) {
        return { fallback: tracks[0].src };
      }
    } catch (domErr) {
      console.warn('DOM caption fallback also failed:', domErr.message);
    }

    return null;
  }
}

export function extractVideoId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

export function formatTranscriptForAI(lines) {
  if (!lines || !Array.isArray(lines)) return '';

  return lines
    .map(l => {
      const secs = Math.floor(l.startMs / 1000);
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      return `[${mins}:${String(s).padStart(2, '0')}] ${l.text}`;
    })
    .join('\n');
}
