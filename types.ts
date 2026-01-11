
export interface ProductData {
  product_name: string;
  product_description: string;
  price_usd: string;
  shipping_info: string;
  rating: string;
  video_assets_urls: string;
}

export interface StoryboardItem {
  time: string;
  visual: string;
  overlay_text: string;
}

export interface ViralPackageResponse {
  campaign_analysis: {
    target_audience: string;
    pain_point_addressed: string;
  };
  video_assets: {
    hook_title: string;
    script_voiceover: string;
    visual_storyboard: StoryboardItem[];
  };
  metadata: {
    caption: string;
    hashtags: string[];
    recommended_music_vibe: string;
  };
}
