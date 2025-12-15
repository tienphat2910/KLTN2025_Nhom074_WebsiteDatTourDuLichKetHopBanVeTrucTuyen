import { env } from '@/config/env';

export async function getPersonalizedRecommendations() {
  try {
    const token = localStorage.getItem('lutrip_token') || localStorage.getItem('lutrip_admin_token');
    const res = await fetch(`${env.API_BASE_URL}/recommendations/personalized`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Recommendation service error:', error);
    return { success: false, message: error.message };
  }
}

export async function getUpsell(destinationIdOrSlug: string) {
  try {
    const token = localStorage.getItem('lutrip_token') || localStorage.getItem('lutrip_admin_token');
    const params = new URLSearchParams();
    // allow passing either an id or a slug
    if (destinationIdOrSlug && destinationIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      params.set('destinationId', destinationIdOrSlug);
    } else {
      params.set('destinationSlug', destinationIdOrSlug);
    }

    const res = await fetch(`${env.API_BASE_URL}/recommendations/upsell?${params.toString()}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('Upsell service error:', error);
    return { success: false, message: error.message };
  }
}
