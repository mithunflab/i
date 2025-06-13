
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
    const { message, projectId, channelData, generateCode = true } = await req.json();
    
    console.log('📨 AI Chat request received:', {
      message: message.substring(0, 50) + '...',
      projectId,
      generateCode,
      hasChannelData: !!channelData
    });

    // Get OpenRouter API key from environment
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterApiKey) {
      console.error('❌ OpenRouter API key not found');
      throw new Error('OpenRouter API key not configured');
    }

    console.log('✅ Found OpenRouter API key');

    // Free models for random selection
    const freeModels = [
      'nousresearch/deephermes-3-mistral-24b-preview:free',
      'deepseek/deepseek-r1-0528:free'
    ];
    
    // Randomly select one of the free models
    const selectedModel = freeModels[Math.floor(Math.random() * freeModels.length)];
    console.log('🎲 Selected free AI model:', selectedModel);

    // Enhanced prompt for real-time website generation
    const enhancedPrompt = `You are an expert web developer creating stunning, modern websites. 

USER REQUEST: ${message}

${channelData ? `
YOUTUBE CHANNEL DATA:
- Channel: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- Description: ${channelData.description}
- Latest Videos: ${channelData.videos?.slice(0, 3).map((v: any) => v.title).join(', ') || 'None'}
` : ''}

Generate a complete, modern HTML website with:
1. Responsive design using Tailwind CSS
2. Professional styling with gradients and animations
3. Real YouTube channel integration if data provided
4. Interactive elements and hover effects
5. Mobile-optimized layout
6. SEO-friendly structure

Return ONLY the complete HTML code, no explanations. Make it visually stunning and professional.`;

    console.log('🤖 Sending request to OpenRouter with enhanced prompt...');

    // Call OpenRouter API with selected free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.ai',
        'X-Title': 'AI Website Builder'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer creating professional, modern websites with real-time data integration.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API Error:', response.status, errorText);
      throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generatedCode = data.choices[0]?.message?.content;

    if (!generatedCode) {
      throw new Error('No code generated from AI');
    }

    console.log('✅ Professional website generated successfully using:', selectedModel);

    // Create response with enhanced features
    const aiResponse = {
      reply: `🎨 **Professional Website Generated!**\n\n✨ **AI Model Used**: ${selectedModel}\n\n🎯 **Features Created**:\n• Modern responsive design\n• Real-time YouTube integration\n• Professional animations\n• Mobile-optimized layout\n• SEO-friendly structure\n\n🚀 **Your stunning website is ready for deployment!**`,
      feature: 'professional-website',
      generatedCode: generatedCode.replace(/```html|```/g, '').trim(),
      codeDescription: `Professional website generated using ${selectedModel} with real-time features`,
      model: selectedModel
    };

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in chat function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate website',
      reply: '❌ Sorry, I encountered an error generating your website. Please try again with a more specific request.',
      generatedCode: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
