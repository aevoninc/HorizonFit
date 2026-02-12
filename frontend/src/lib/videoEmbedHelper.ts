/**
 * Video Embed Helper - Converts various video URLs to proper embed formats
 */

interface VideoEmbedResult {
  embedUrl: string;
  isValid: boolean;
  error?: string;
  originalUrl: string;
}

/**
 * Extract Google Drive File ID from various Google Drive URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  // Format: https://drive.google.com/file/d/{FILE_ID}/view
  const viewMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (viewMatch) return viewMatch[1];

  // Format: https://drive.google.com/open?id={FILE_ID}
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (openMatch) return openMatch[1];

  // Format: {FILE_ID} (just the ID)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url)) return url;

  return null;
}

/**
 * Convert various video URLs to embeddable iframe sources
 */
export function getEmbedUrl(videoUrl: string): VideoEmbedResult {
  if (!videoUrl || !videoUrl.trim()) {
    return {
      embedUrl: '',
      isValid: false,
      error: 'No video URL provided',
      originalUrl: videoUrl
    };
  }

  const trimmedUrl = videoUrl.trim();

  // Google Drive
  if (trimmedUrl.includes('drive.google.com')) {
    const fileId = extractGoogleDriveFileId(trimmedUrl);
    if (fileId) {
      return {
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        isValid: true,
        originalUrl: videoUrl
      };
    }
    return {
      embedUrl: '',
      isValid: false,
      error: 'Invalid Google Drive URL format. Please use: https://drive.google.com/file/d/{FILE_ID}/view',
      originalUrl: videoUrl
    };
  }

  // YouTube (already in embed format or needs conversion)
  if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(trimmedUrl);
    if (videoId) {
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        isValid: true,
        originalUrl: videoUrl
      };
    }
    return {
      embedUrl: '',
      isValid: false,
      error: 'Invalid YouTube URL format',
      originalUrl: videoUrl
    };
  }

  // Vimeo
  if (trimmedUrl.includes('vimeo.com')) {
    const videoId = extractVimeoVideoId(trimmedUrl);
    if (videoId) {
      return {
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
        isValid: true,
        originalUrl: videoUrl
      };
    }
    return {
      embedUrl: '',
      isValid: false,
      error: 'Invalid Vimeo URL format',
      originalUrl: videoUrl
    };
  }

  // If it's already an embed URL or direct video file, use as-is
  if (trimmedUrl.includes('/embed/') || 
      trimmedUrl.includes('/preview') ||
      /\.(mp4|webm|ogg|mov)$/.test(trimmedUrl)) {
    return {
      embedUrl: trimmedUrl,
      isValid: true,
      originalUrl: videoUrl
    };
  }

  // Default: assume it's a valid embed URL
  return {
    embedUrl: trimmedUrl,
    isValid: true,
    originalUrl: videoUrl
  };
}

/**
 * Extract YouTube video ID
 */
function extractYouTubeVideoId(url: string): string | null {
  // youtube.com/embed/{VIDEO_ID}
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9-_]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/watch?v={VIDEO_ID}
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9-_]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/{VIDEO_ID}
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9-_]{11})/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Extract Vimeo video ID
 */
function extractVimeoVideoId(url: string): string | null {
  // vimeo.com/{VIDEO_ID}
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return match[1];

  // player.vimeo.com/video/{VIDEO_ID}
  const playerMatch = url.match(/\/video\/(\d+)/);
  if (playerMatch) return playerMatch[1];

  return null;
}

/**
 * Format Google Drive URL instructions for users
 */
export function getVideoUrlInstructions(platform: 'google-drive' | 'youtube' | 'vimeo' | 'general'): string {
  const instructions = {
    'google-drive': `
1. Upload your video to Google Drive
2. Right-click the video file → Share
3. Change permissions to "Anyone with the link" or "Public"
4. Copy the full sharing link (example: https://drive.google.com/file/d/ABC123xyz/view)
5. Paste the link in the Video URL field
    `,
    'youtube': `
1. Upload your video to YouTube (can be unlisted or private)
2. Copy the video URL (example: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Paste the link in the Video URL field
    `,
    'vimeo': `
1. Upload your video to Vimeo
2. Share your video (set appropriate privacy settings)
3. Copy the video URL (example: https://vimeo.com/123456789)
4. Paste the link in the Video URL field
    `,
    'general': `
Enter a valid video URL from:
• Google Drive: https://drive.google.com/file/d/{FILE_ID}/view
• YouTube: https://www.youtube.com/watch?v={VIDEO_ID}
• Vimeo: https://vimeo.com/{VIDEO_ID}
• Direct video file (MP4, WebM, etc.)
    `
  };

  return instructions[platform] || instructions['general'];
}
