
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      channelData, 
      projectIdea, 
      userRequest,
      includeRealVideos = true,
      generateMultipleFiles = true,
      preserveDesign = false,
      currentCode = ''
    } = await req.json();

    console.log('🏗️ Generating professional website with real data...');

    // Get OpenRouter API key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData } = await supabase
      .from('openrouter_api_keys')
      .select('api_key')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!apiKeyData?.api_key) {
      throw new Error('OpenRouter API key not found');
    }

    // Determine if this is a targeted modification or new generation
    const isTargetedModification = preserveDesign && currentCode && userRequest;

    let prompt;
    
    if (isTargetedModification) {
      // Enhanced targeted modification prompt
      prompt = `
# 🎯 CRITICAL: TARGETED WEBSITE MODIFICATION WITH REAL DATA

## PRESERVATION MANDATE
**ONLY MODIFY THE SPECIFIC ELEMENT REQUESTED. PRESERVE EVERYTHING ELSE EXACTLY.**

### Current Website Code (PRESERVE 95%)
\`\`\`html
${currentCode.substring(0, 2000)}...
\`\`\`

### User's Specific Request
"${userRequest}"

### Real YouTube Channel Data (USE EXACTLY)
- Channel: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount).toLocaleString()}
- Videos: ${parseInt(channelData.videoCount).toLocaleString()}
- Channel Thumbnail: ${channelData.thumbnail}

### STRICT MODIFICATION RULES
1. 🚫 **NEVER** rewrite the entire website
2. 🚫 **NEVER** change existing colors, fonts, or layout
3. 🚫 **NEVER** remove YouTube branding or channel data
4. 🚫 **NEVER** modify components not mentioned in the request
5. ✅ **ONLY** change the specific element mentioned in the user request

### Real Video Data Integration
${channelData.videos?.slice(0, 6).map((video: any, index: number) => `
Video ${index + 1}:
- Title: ${video.title}
- Thumbnail: ${video.thumbnail}
- Views: ${parseInt(video.viewCount).toLocaleString()}
- Embed URL: ${video.embedUrl}
`).join('')}

## CRITICAL OUTPUT REQUIREMENTS
1. **Minimal Change**: Modify ONLY what the user specifically requested
2. **Preserve Design**: Keep ALL existing styling, colors, and layout
3. **Real Data**: Use actual YouTube channel and video information
4. **Professional Quality**: Maintain clean, production-ready code
5. **Working Links**: All YouTube embeds and links must work

Generate the complete HTML with the targeted modification applied while preserving everything else exactly as it was.
`;
    } else {
      // New professional website generation
      prompt = `
# 🏗️ GENERATE PROFESSIONAL YOUTUBE CHANNEL WEBSITE

## Project Requirements
Create a complete, professional website for YouTube channel: **${channelData.title}**

### Real Channel Data (MUST USE)
- Channel Name: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount).toLocaleString()}
- Total Videos: ${parseInt(channelData.videoCount).toLocaleString()}
- Total Views: ${parseInt(channelData.viewCount).toLocaleString()}
- Channel Thumbnail: ${channelData.thumbnail}
- Description: ${channelData.description?.substring(0, 200)}...

### Real Video Gallery (MUST INCLUDE)
${channelData.videos?.slice(0, 8).map((video: any, index: number) => `
Video ${index + 1}:
- Title: ${video.title}
- Thumbnail: ${video.thumbnail}
- Views: ${parseInt(video.viewCount).toLocaleString()}
- Published: ${new Date(video.publishedAt).toLocaleDateString()}
- Embed URL: ${video.embedUrl}
`).join('')}

## Website Structure Required
1. **Header Section**
   - Channel logo (${channelData.thumbnail}) in top-left
   - Professional navigation: Home | About | Videos | Contact
   - Subscribe button linking to YouTube

2. **Hero Section**
   - Channel name: ${channelData.title}
   - Subscriber count: ${parseInt(channelData.subscriberCount).toLocaleString()} subscribers
   - Professional call-to-action
   - Channel description preview

3. **Video Gallery Section**
   - Real video thumbnails with hover effects
   - Video titles, view counts, and publish dates
   - Click to open YouTube player/embed
   - "Load More Videos" functionality

4. **About Section**
   - Channel statistics (subscribers, videos, views)
   - Channel description
   - Social media links

5. **Contact Section**
   - Contact form
   - Social media integration
   - Channel information

## Design Requirements
- **Professional & Modern**: Clean, YouTube-inspired design
- **Mobile Responsive**: Perfect on all devices
- **Real Data Integration**: All numbers and content must be real
- **Working Functionality**: All links and embeds must work
- **SEO Optimized**: Proper meta tags and structure
- **Performance**: Fast loading with optimized images

## Technical Requirements
- **Single HTML File**: Complete website in one file
- **Embedded CSS**: Professional styling with CSS Grid/Flexbox
- **Embedded JavaScript**: Interactive functionality
- **YouTube Integration**: Working video embeds and subscribe links
- **Real API Data**: Use all provided channel and video data

## Color Scheme
- Primary: YouTube Red (#FF0000) for CTAs
- Secondary: Dark theme with white text
- Accent: Channel branding colors
- Background: Professional gradients

Generate a complete, professional HTML website that showcases ${channelData.title} with all real data integrated perfectly.
`;
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'YouTube Website Builder'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer specializing in creating professional YouTube channel websites with real data integration. You generate clean, modern, responsive HTML/CSS/JS code that works perfectly with real YouTube data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiData = await response.json();
    const generatedCode = aiData.choices[0]?.message?.content;

    if (!generatedCode) {
      throw new Error('No code generated by AI');
    }

    console.log('✅ Professional website generated successfully');

    return new Response(
      JSON.stringify({
        generatedCode,
        reply: isTargetedModification 
          ? `✅ I've made the targeted changes you requested while preserving your existing design and all YouTube integration. The modification maintains your professional website structure and only updates the specific element you mentioned.`
          : `🎉 I've created a professional website for ${channelData.title} featuring real subscriber count (${parseInt(channelData.subscriberCount).toLocaleString()}), actual video gallery with ${channelData.videos?.length || 0} latest videos, and complete YouTube integration. The website includes working video embeds, channel statistics, and professional navigation.`,
        feature: isTargetedModification ? 'targeted-modification' : 'professional-website-generation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Website generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Website generation failed',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
