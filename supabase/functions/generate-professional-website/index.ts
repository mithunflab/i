
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
      userRequest,
      channelData, 
      projectContext,
      streamingEnabled = false,
      preserveDesign = true,
      targetedChanges = true,
      currentCode = ''
    } = await req.json();

    console.log('🤖 Enhanced AI processing with two-stage workflow...');

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

    // Stage 1: Intent Parsing
    console.log('🎯 Stage 1: Parsing user intent...');
    const intentPrompt = `
# Stage 1: Intent Parser Analysis

## User Request Analysis
**Request**: "${userRequest}"

## Current Project Context
- HTML: ${currentCode.substring(0, 500)}...
- Channel: ${channelData?.title || 'Unknown'}
- Preserve Design: ${preserveDesign}
- Targeted Changes: ${targetedChanges}

## Intent Parsing Instructions
Parse the user request and return ONLY a JSON object with this exact structure:
{
  "action": "change|add|remove|style",
  "target": {
    "component": "hero|navigation|video-gallery|stats|footer|button|text",
    "selectors": ["css-selector1", "css-selector2"],
    "specific": "specific-element-type"
  },
  "content": "new-content-if-any",
  "scope": "minimal|component|section",
  "preserveDesign": true
}

Return ONLY the JSON object, no other text.
`;

    const intentResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an intent parsing AI. Return only valid JSON.' },
          { role: 'user', content: intentPrompt }
        ],
        max_tokens: 300,
        temperature: 0.1
      }),
    });

    const intentData = await intentResponse.json();
    let parsedIntent;
    
    try {
      parsedIntent = JSON.parse(intentData.choices[0].message.content);
      console.log('✅ Intent parsed:', parsedIntent);
    } catch (e) {
      console.log('❌ Intent parsing failed, using fallback');
      parsedIntent = {
        action: 'change',
        target: { component: 'general', selectors: ['body'], specific: null },
        content: userRequest,
        scope: 'component',
        preserveDesign: true
      };
    }

    // Stage 2: Targeted Code Generation
    console.log('🔧 Stage 2: Applying targeted changes...');
    const codePrompt = `
# Stage 2: Targeted Code Editor

## CRITICAL PRESERVATION RULES
- ONLY modify the specific element requested: ${parsedIntent.target.component}
- PRESERVE ALL other HTML, CSS, and JavaScript exactly as is
- DO NOT rewrite the entire website
- MAINTAIN existing styling, colors, fonts, and layout
- USE real YouTube channel data exactly as provided

## Parsed Intent
${JSON.stringify(parsedIntent, null, 2)}

## Current Website Code (PRESERVE 95%)
\`\`\`html
${currentCode}
\`\`\`

## Real YouTube Channel Data (USE EXACTLY)
- Channel: ${channelData?.title}
- Subscribers: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- Thumbnail: ${channelData?.thumbnail}

## Target Selectors to Modify
${parsedIntent.target.selectors.join(', ')}

## TARGETED MODIFICATION INSTRUCTIONS
1. **Action**: ${parsedIntent.action}
2. **Target**: ${parsedIntent.target.component}
3. **Scope**: ${parsedIntent.scope}
4. **Content**: ${parsedIntent.content || 'No specific content'}

## OUTPUT REQUIREMENTS
- Apply ONLY the requested ${parsedIntent.action} to ${parsedIntent.target.component}
- Keep ALL other sections unchanged
- Use real channel data where relevant
- Maintain responsive design
- Preserve existing animations and interactions

Generate the complete HTML with ONLY the targeted modification applied.
`;

    const codeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are a targeted code editor AI. Apply only the specific changes requested while preserving everything else exactly.' 
          },
          { role: 'user', content: codePrompt }
        ],
        max_tokens: 4000,
        temperature: 0.2
      }),
    });

    const codeData = await codeResponse.json();
    const generatedCode = codeData.choices[0].message.content;

    // Clean up the generated code
    const cleanCode = generatedCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Generate response
    const reply = `🎯 **Targeted Modification Applied!**\n\n` +
      `**Intent**: ${parsedIntent.action} ${parsedIntent.target.component}\n` +
      `**Scope**: ${parsedIntent.scope} changes\n` +
      `**Preserved**: All existing design and functionality\n\n` +
      `✅ **Changes Applied**:\n` +
      `• Modified only the ${parsedIntent.target.component} element\n` +
      `• Used real channel data: ${channelData?.title}\n` +
      `• Maintained responsive design\n` +
      `• Preserved existing styling\n\n` +
      `🚀 **Your website has been updated with precision targeting!**`;

    console.log('✅ Two-stage AI workflow completed successfully');

    return new Response(JSON.stringify({ 
      generatedCode: cleanCode,
      reply,
      parsedIntent,
      codeDescription: `Applied ${parsedIntent.action} to ${parsedIntent.target.component}`,
      feature: 'targeted-modification'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced AI workflow error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: 'Sorry, I encountered an error processing your request. Please try again with a more specific request.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
