
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  userRequest: string;
  channelData?: any;
  projectId: string;
  currentCode?: string;
  preserveDesign?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Unified AI Generation started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userRequest, channelData, projectId, currentCode, preserveDesign = true }: AIRequest = await req.json();
    
    console.log('📝 Request details:', { userRequest: userRequest.substring(0, 100), projectId, hasChannelData: !!channelData });

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('✅ User authenticated:', user.email);

    // Try multiple AI providers in order: OpenRouter -> Groq -> Fallback
    let generatedCode = '';
    let aiResponse = '';
    let usedProvider = '';

    // 1. Try OpenRouter first
    try {
      const openRouterResult = await tryOpenRouter(userRequest, channelData, currentCode, preserveDesign);
      if (openRouterResult) {
        generatedCode = openRouterResult.code;
        aiResponse = openRouterResult.response;
        usedProvider = 'OpenRouter';
        console.log('✅ OpenRouter generation successful');
      }
    } catch (error) {
      console.log('⚠️ OpenRouter failed, trying Groq:', error.message);
    }

    // 2. Try Groq if OpenRouter failed
    if (!generatedCode) {
      try {
        const groqResult = await tryGroq(userRequest, channelData, currentCode, preserveDesign);
        if (groqResult) {
          generatedCode = groqResult.code;
          aiResponse = groqResult.response;
          usedProvider = 'Groq';
          console.log('✅ Groq generation successful');
        }
      } catch (error) {
        console.log('⚠️ Groq failed, using fallback:', error.message);
      }
    }

    // 3. Fallback generation if both failed
    if (!generatedCode) {
      const fallbackResult = generateFallbackCode(userRequest, channelData, currentCode);
      generatedCode = fallbackResult.code;
      aiResponse = fallbackResult.response;
      usedProvider = 'Fallback';
      console.log('✅ Fallback generation used');
    }

    // Update project in database
    if (projectId && generatedCode) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          source_code: generatedCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Project update error:', updateError);
      } else {
        console.log('✅ Project updated successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generatedCode,
      reply: aiResponse,
      provider: usedProvider,
      codeDescription: `Website updated successfully using ${usedProvider}`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unified AI Generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function tryOpenRouter(userRequest: string, channelData: any, currentCode?: string, preserveDesign?: boolean) {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    throw new Error('OpenRouter API key not found');
  }

  const systemPrompt = `You are an expert web developer. Generate a complete, professional HTML website with embedded CSS and JavaScript.

Key Requirements:
- Generate ONLY the complete HTML code with embedded CSS and JavaScript
- Make it responsive and modern with professional styling
- ${preserveDesign ? 'Preserve the existing design while making the requested changes' : 'Create a new professional design'}
- Use real data from the channel information provided
- Include working YouTube embeds and subscribe buttons
- Make it visually appealing with animations and transitions

Return ONLY the HTML code, no explanations or markdown.`;

  const userPrompt = `
User Request: ${userRequest}

${channelData ? `Channel Data: ${JSON.stringify(channelData, null, 2)}` : ''}

${currentCode ? `Current Code to modify: ${currentCode}` : 'Create a new website'}

Generate a complete, professional website that incorporates the user's request${channelData ? ' while using the provided channel data' : ''}.
`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Lovable AI Website Builder'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedCode = data.choices?.[0]?.message?.content;

  if (!generatedCode) {
    throw new Error('No code generated from OpenRouter');
  }

  return {
    code: generatedCode,
    response: 'Website generated successfully with OpenRouter AI'
  };
}

async function tryGroq(userRequest: string, channelData: any, currentCode?: string, preserveDesign?: boolean) {
  // Get Groq API key from database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: groqKeys } = await supabase
    .from('groq_api_keys')
    .select('api_key')
    .eq('is_active', true)
    .limit(1);

  if (!groqKeys || groqKeys.length === 0) {
    throw new Error('No active Groq API key found');
  }

  const groqKey = groqKeys[0].api_key;

  const systemPrompt = `You are an expert web developer. Generate a complete, professional HTML website with embedded CSS and JavaScript.

Key Requirements:
- Generate ONLY the complete HTML code with embedded CSS and JavaScript  
- Make it responsive and modern with professional styling
- ${preserveDesign ? 'Preserve the existing design while making the requested changes' : 'Create a new professional design'}
- Use real data from the channel information provided
- Include working YouTube embeds and subscribe buttons
- Make it visually appealing with animations and transitions

Return ONLY the HTML code, no explanations or markdown.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userRequest}\n\n${channelData ? JSON.stringify(channelData) : ''}${currentCode ? `\n\nCurrent code: ${currentCode}` : ''}` }
      ],
      temperature: 0.7,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedCode = data.choices?.[0]?.message?.content;

  if (!generatedCode) {
    throw new Error('No code generated from Groq');
  }

  return {
    code: generatedCode,
    response: 'Website generated successfully with Groq AI'
  };
}

function generateFallbackCode(userRequest: string, channelData: any, currentCode?: string) {
  const channelTitle = channelData?.title || 'Your Channel';
  const subscriberCount = channelData?.subscriberCount || '0';
  
  const fallbackCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelTitle} - Professional Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 0; text-align: center; }
        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; }
        .stats { background: #f8f9fa; padding: 60px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .stat-card { background: white; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5rem; font-weight: bold; color: #667eea; }
        .footer { background: #333; color: white; padding: 40px 0; text-align: center; }
        @media (max-width: 768px) { .hero h1 { font-size: 2rem; } }
    </style>
</head>
<body>
    <div class="hero">
        <div class="container">
            <h1>${channelTitle}</h1>
            <p>Welcome to our professional website</p>
            <p>Request: ${userRequest}</p>
        </div>
    </div>
    <div class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${parseInt(subscriberCount).toLocaleString()}</div>
                    <div>Subscribers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">Professional</div>
                    <div>Quality</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">24/7</div>
                    <div>Available</div>
                </div>
            </div>
        </div>
    </div>
    <div class="footer">
        <div class="container">
            <p>&copy; 2024 ${channelTitle}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

  return {
    code: fallbackCode,
    response: 'Website generated with fallback system - AI providers temporarily unavailable'
  };
}
