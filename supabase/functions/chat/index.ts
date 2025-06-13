
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get active OpenRouter API key from database
    console.log('🔍 Fetching OpenRouter API key from database...');
    const { data: openrouterKeys, error: openrouterError } = await supabase
      .from('openrouter_api_keys')
      .select('api_key, name')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (openrouterError) {
      console.error('❌ Database Error fetching OpenRouter keys:', openrouterError);
      throw new Error(`Database error: ${openrouterError.message}`);
    }

    if (!openrouterKeys || openrouterKeys.length === 0) {
      console.error('❌ No active OpenRouter API keys found in database');
      throw new Error('No active OpenRouter API keys found. Please add API keys in admin panel.');
    }

    const openRouterApiKey = openrouterKeys[0].api_key;
    console.log('✅ Found OpenRouter API key:', openrouterKeys[0].name);

    // Validate API key format
    if (!openRouterApiKey || typeof openRouterApiKey !== 'string' || openRouterApiKey.trim() === '') {
      console.error('❌ Invalid OpenRouter API key: empty or invalid format');
      throw new Error('Invalid OpenRouter API key format. Please check the API key in admin panel.');
    }

    // Additional validation for OpenRouter key format
    if (!openRouterApiKey.startsWith('sk-or-')) {
      console.error('❌ Invalid OpenRouter API key format - should start with sk-or-');
      throw new Error('Invalid OpenRouter API key format. OpenRouter keys should start with "sk-or-".');
    }

    // Free models for random selection
    const freeModels = [
      'nousresearch/hermes-3-llama-3.1-405b:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemma-2-9b-it:free'
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
    console.log('🔑 API Key validation:', {
      hasKey: !!openRouterApiKey,
      keyLength: openRouterApiKey.length,
      startsCorrectly: openRouterApiKey.startsWith('sk-or-'),
      keyPrefix: openRouterApiKey.substring(0, 10) + '...'
    });

    // Call OpenRouter API with proper authentication and error handling
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': supabaseUrl || 'https://ldcipixxhnrepgkyzmno.supabase.co',
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

    console.log('📡 OpenRouter API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      // Handle specific error cases with detailed messages
      if (response.status === 401) {
        throw new Error('OpenRouter API authentication failed. The API key may be invalid or expired. Please check the API key in admin panel.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 400) {
        throw new Error(`Bad request to OpenRouter API: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error('OpenRouter API access forbidden. Please check your API key permissions.');
      } else {
        throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('📊 OpenRouter API Response received:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasUsage: !!data.usage
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response structure from OpenRouter:', data);
      throw new Error('Invalid response structure from OpenRouter API');
    }

    const generatedCode = data.choices[0].message.content;

    if (!generatedCode || typeof generatedCode !== 'string') {
      console.error('❌ No valid code generated from AI');
      throw new Error('No valid code generated from AI');
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
    
    // Return a more helpful error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      reply: `❌ **AI Generation Error**\n\n${errorMessage}\n\n🔄 **Troubleshooting Steps:**\n1. Verify OpenRouter API key is properly configured\n2. Check API key permissions and credits\n3. Try again with a simpler request\n4. Contact admin if API key issues persist\n\n💡 **Example**: "Create a modern landing page for a science YouTube channel"`,
      generatedCode: null
    }), {
      status: 200, // Return 200 to avoid frontend errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
