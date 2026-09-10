import { HotspotRecord } from '../types';

export async function requestGeminiAssessment(
  hotspot: HotspotRecord,
): Promise<{ assessment?: string; error?: string }> {
  try {
    const response = await fetch('/api/gemini/assess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hotspot }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          'Failed to generate AI assessment from server. Structured evidence is still available.',
      };
    }

    return { assessment: data.assessment };
  } catch (err: any) {
    return {
      error:
        err.message ||
        'Network error contacting AI assessment service. Structured evidence remains accessible.',
    };
  }
}
