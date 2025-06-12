
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, channelData, chatHistory } = await req.json();

    // Get OpenRouter API key from database
    const { data: openrouterKeys, error: keyError } = await supabase
      .from('openrouter_api_keys')
      .select('api_key')
      .eq('is_active', true)
      .limit(1);

    if (keyError || !openrouterKeys || openrouterKeys.length === 0) {
      console.error('No OpenRouter API key found:', keyError);
      throw new Error('OpenRouter API key not configured');
    }

    const openRouterKey = openrouterKeys[0].api_key;

    // Log API usage
    await supabase
      .from('real_time_api_usage')
      .insert({
        provider: 'openrouter',
        endpoint: '/chat/completions',
        project_id: projectId,
        usage_timestamp: new Date().toISOString()
      });

    // Prepare context from chat history
    const contextMessages = chatHistory.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const channelName = channelData?.title || 'YouTube channel';
    const systemPrompt = `You are a helpful AI assistant specialized in creating YouTube channel websites. 
    You're helping create a website for ${channelName}. 
    ${channelData ? `Channel info: ${channelData.subscriberCount} subscribers, ${channelData.videoCount} videos.` : ''}
    
    Respond enthusiastically about YouTube features like video integration, channel branding, subscribe widgets, SEO optimization, and mobile design.
    Always mention the channel name when relevant and be specific about YouTube creator features.
    Keep responses concise but exciting, using emojis and focusing on actionable website improvements.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL'),
        'X-Title': 'YouTube Website Builder'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages.slice(-4), // Last 4 messages for context
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again!';

    // Determine feature category
    let feature = '';
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('video') || lowerMessage.includes('youtube')) {
      feature = 'video';
    } else if (lowerMessage.includes('brand') || lowerMessage.includes('color') || lowerMessage.includes('style')) {
      feature = 'branding';
    } else if (lowerMessage.includes('subscribe') || lowerMessage.includes('audience')) {
      feature = 'audience';
    } else if (lowerMessage.includes('mobile') || lowerMessage.includes('phone')) {
      feature = 'mobile';
    }

    // Update API usage with success
    await supabase
      .from('real_time_api_usage')
      .update({
        success_count: 1,
        response_time_ms: Date.now()
      })
      .eq('provider', 'openrouter')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({ reply, feature }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat function:', error);
    
    // Log error in API usage
    await supabase
      .from('real_time_api_usage')
      .insert({
        provider: 'openrouter',
        endpoint: '/chat/completions',
        error_count: 1,
        usage_timestamp: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "I'm experiencing some technical difficulties. Please try again in a moment!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
