
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

    console.log('🤖 Enhanced AI processing with Together AI and Groq fallback...');

    // Get Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get Together AI API key first
    const { data: togetherKeyData } = await supabase
      .from('together_api_keys')
      .select('api_key')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get Groq API key as fallback
    const { data: groqKeyData } = await supabase
      .from('groq_api_keys')
      .select('api_key')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!togetherKeyData?.api_key && !groqKeyData?.api_key) {
      throw new Error('No Together AI or Groq API keys found');
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

    let parsedIntent;
    let usingProvider = 'together';

    try {
      // Try Together AI first
      if (togetherKeyData?.api_key) {
        console.log('🤝 Using Together AI for intent parsing...');
        
        const togetherResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${togetherKeyData.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
            messages: [
              { role: 'system', content: 'You are an intent parsing AI. Return only valid JSON.' },
              { role: 'user', content: intentPrompt }
            ],
            max_tokens: 300,
            temperature: 0.1
          }),
        });

        if (togetherResponse.ok) {
          const togetherData = await togetherResponse.json();
          parsedIntent = JSON.parse(togetherData.choices[0].message.content);
          console.log('✅ Intent parsed with Together AI:', parsedIntent);
        } else {
          throw new Error('Together AI request failed');
        }
      } else {
        throw new Error('No Together AI key available');
      }
    } catch (togetherError) {
      console.log('❌ Together AI failed, trying Groq fallback...', togetherError.message);
      
      if (groqKeyData?.api_key) {
        usingProvider = 'groq';
        console.log('⚡ Using Groq for intent parsing...');
        
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKeyData.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [
              { role: 'system', content: 'You are an intent parsing AI. Return only valid JSON.' },
              { role: 'user', content: intentPrompt }
            ],
            max_tokens: 300,
            temperature: 0.1
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          parsedIntent = JSON.parse(groqData.choices[0].message.content);
          console.log('✅ Intent parsed with Groq:', parsedIntent);
        } else {
          throw new Error('Both Together AI and Groq failed');
        }
      } else {
        throw new Error('No API keys available');
      }
    }
    
    // Fallback if parsing fails
    if (!parsedIntent) {
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

    let generatedCode;

    try {
      if (usingProvider === 'together' && togetherKeyData?.api_key) {
        console.log('🤝 Using Together AI for code generation...');
        
        const codeResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${togetherKeyData.api_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
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

        if (codeResponse.ok) {
          const codeData = await codeResponse.json();
          generatedCode = codeData.choices[0].message.content;
        } else {
          throw new Error('Together AI code generation failed');
        }
      } else {
        throw new Error('Falling back to Groq');
      }
    } catch (codeError) {
      console.log('❌ Together AI code generation failed, using Groq...', codeError.message);
      
      if (groqKeyData?.api_key) {
        console.log('⚡ Using Groq for code generation...');
        
        // Try different Groq models
        const groqModels = ['llama3-70b-8192', 'mixtral-8x7b-32768', 'deepseek-coder-33b'];
        
        for (const model of groqModels) {
          try {
            const codeResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKeyData.api_key}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: model,
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

            if (codeResponse.ok) {
              const codeData = await codeResponse.json();
              generatedCode = codeData.choices[0].message.content;
              console.log(`✅ Code generated with Groq model: ${model}`);
              break;
            }
          } catch (modelError) {
            console.log(`❌ Groq model ${model} failed:`, modelError.message);
            continue;
          }
        }
        
        if (!generatedCode) {
          throw new Error('All Groq models failed');
        }
      } else {
        throw new Error('No Groq API key available');
      }
    }

    if (!generatedCode) {
      throw new Error('Failed to generate code with any provider');
    }

    // Clean up the generated code
    const cleanCode = generatedCode
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Generate response
    const reply = `🎯 **Targeted Modification Applied!** (Using ${usingProvider === 'together' ? 'Together AI' : 'Groq'})\n\n` +
      `**Intent**: ${parsedIntent.action} ${parsedIntent.target.component}\n` +
      `**Scope**: ${parsedIntent.scope} changes\n` +
      `**Preserved**: All existing design and functionality\n\n` +
      `✅ **Changes Applied**:\n` +
      `• Modified only the ${parsedIntent.target.component} element\n` +
      `• Used real channel data: ${channelData?.title}\n` +
      `• Maintained responsive design\n` +
      `• Preserved existing styling\n\n` +
      `🚀 **Your website has been updated with precision targeting!**`;

    console.log(`✅ Two-stage AI workflow completed successfully using ${usingProvider}`);

    return new Response(JSON.stringify({ 
      generatedCode: cleanCode,
      reply,
      parsedIntent,
      codeDescription: `Applied ${parsedIntent.action} to ${parsedIntent.target.component}`,
      feature: 'targeted-modification',
      provider: usingProvider
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
