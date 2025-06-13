
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
    console.log('🚀 Enhanced AI Generation started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userRequest, channelData, projectId, currentCode, preserveDesign = true }: AIRequest = await req.json();
    
    console.log('📝 Request details:', { userRequest: userRequest.substring(0, 100), projectId, hasChannelData: !!channelData });

    // Get user from auth header with improved handling
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔑 Attempting to authenticate user with token');

        const { data: userData, error: authError } = await supabase.auth.getUser(token);

        if (!authError && userData?.user) {
          user = userData.user;
          console.log('✅ User authenticated:', user.email);
        } else {
          console.log('⚠️ Token authentication failed, proceeding without user validation');
        }
      } catch (error) {
        console.log('⚠️ Auth error, proceeding without user validation:', error.message);
      }
    } else {
      console.log('⚠️ No authorization header, proceeding without user validation');
    }

    // Prioritize Groq for high-quality generation
    let generatedCode = '';
    let aiResponse = '';
    let usedProvider = '';

    // 1. Try Groq first (prioritized for quality)
    try {
      console.log('🤖 Trying Groq AI for high-quality generation...');
      const groqResult = await tryGroq(userRequest, channelData, currentCode, preserveDesign);
      if (groqResult) {
        generatedCode = groqResult.code;
        aiResponse = groqResult.response;
        usedProvider = 'Groq';
        console.log('✅ Groq generation successful - high quality code generated');
      }
    } catch (error) {
      console.log('⚠️ Groq failed, trying OpenRouter:', error.message);
    }

    // 2. Try OpenRouter as backup
    if (!generatedCode) {
      try {
        console.log('🤖 Trying OpenRouter as backup...');
        const openRouterResult = await tryOpenRouter(userRequest, channelData, currentCode, preserveDesign);
        if (openRouterResult) {
          generatedCode = openRouterResult.code;
          aiResponse = openRouterResult.response;
          usedProvider = 'OpenRouter';
          console.log('✅ OpenRouter generation successful');
        }
      } catch (error) {
        console.log('⚠️ OpenRouter failed, using enhanced fallback:', error.message);
      }
    }

    // 3. Enhanced fallback generation (better quality)
    if (!generatedCode) {
      console.log('🤖 Using enhanced fallback generation...');
      const fallbackResult = generateEnhancedFallbackCode(userRequest, channelData, currentCode);
      generatedCode = fallbackResult.code;
      aiResponse = fallbackResult.response;
      usedProvider = 'Enhanced Fallback';
      console.log('✅ Enhanced fallback generation used');
    }

    // Update project in database only if user is authenticated and projectId exists
    if (projectId && generatedCode && user) {
      console.log('💾 Updating project in database...');
      try {
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
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
    } else if (projectId && generatedCode && !user) {
      console.log('⚠️ Skipping database update - no authenticated user');
    }

    console.log('🎉 Enhanced AI Generation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      generatedCode,
      reply: aiResponse,
      provider: usedProvider,
      codeQuality: usedProvider === 'Groq' ? 'high' : usedProvider === 'OpenRouter' ? 'good' : 'standard',
      codeDescription: `High-quality website generated using ${usedProvider}`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced AI Generation error:', error);
    
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

async function tryGroq(userRequest: string, channelData: any, currentCode?: string, preserveDesign?: boolean) {
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

  const systemPrompt = `You are an expert web developer and UI/UX designer. Generate a complete, modern, professional HTML website with embedded CSS and JavaScript.

REQUIREMENTS:
- Create a stunning, responsive website with modern design trends
- Use advanced CSS features (gradients, animations, flexbox, grid)
- Include interactive elements and smooth animations
- Make it mobile-first responsive design
- Use professional color schemes and typography
- Include modern UI components (cards, buttons, navigation)
- Add engaging micro-interactions and hover effects
- ${preserveDesign ? 'Preserve existing design elements while enhancing them' : 'Create a completely new modern design'}
- Use real data from the channel information provided
- Include working YouTube embeds with modern styling
- Add subscribe buttons and social media integration
- Make it visually stunning and professional

FOCUS ON QUALITY:
- Clean, semantic HTML structure
- Modern CSS with custom properties and animations
- Interactive JavaScript functionality
- Professional visual hierarchy
- Excellent user experience
- Mobile-optimized performance

Return ONLY the complete HTML code with embedded CSS and JavaScript, no explanations.`;

  const userPrompt = `
User Request: ${userRequest}

${channelData ? `Channel Data: ${JSON.stringify(channelData, null, 2)}` : ''}

${currentCode ? `Current Code to enhance: ${currentCode}` : 'Create a new modern website'}

Generate a stunning, professional website that exceeds expectations and incorporates the user's request while using the provided channel data.
`;

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
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
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
    response: 'High-quality website generated successfully with Groq AI - modern, responsive, and professional!'
  };
}

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
    response: 'Professional website generated successfully with OpenRouter AI'
  };
}

function generateEnhancedFallbackCode(userRequest: string, channelData: any, currentCode?: string) {
  const channelTitle = channelData?.title || 'Your Channel';
  const subscriberCount = channelData?.subscriberCount || '0';
  const channelDescription = channelData?.description || 'Welcome to our channel';
  const videos = channelData?.videos || [];
  
  const enhancedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelTitle} - Professional Channel Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 0 20px; 
        }
        
        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }
        
        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        /* Hero Section */
        .hero { 
            color: white; 
            padding: 100px 0; 
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 1;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
        }
        
        .hero h1 { 
            font-size: 3.5rem; 
            margin-bottom: 20px; 
            animation: fadeInUp 1s ease;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .hero p { 
            font-size: 1.3rem; 
            margin-bottom: 30px; 
            animation: fadeInUp 1s ease 0.2s both;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subscribe-btn {
            display: inline-block;
            background: #ff4444;
            color: white;
            padding: 15px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            animation: fadeInUp 1s ease 0.4s both;
            box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
        }
        
        .subscribe-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(255, 68, 68, 0.6);
        }
        
        /* Stats Section */
        .stats { 
            background: white; 
            padding: 80px 0; 
            position: relative;
        }
        
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 40px; 
        }
        
        .stat-card { 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 40px; 
            border-radius: 20px; 
            text-align: center; 
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(45deg, #667eea, #764ba2);
        }
        
        .stat-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .stat-number { 
            font-size: 3rem; 
            font-weight: 700; 
            color: #667eea; 
            margin-bottom: 10px;
            display: block;
        }
        
        .stat-label {
            font-size: 1.2rem;
            color: #666;
            font-weight: 500;
        }
        
        /* Videos Section */
        .videos-section {
            background: #f8f9fa;
            padding: 80px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 50px;
            color: #333;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .videos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
        }
        
        .video-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .video-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }
        
        .video-thumbnail {
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
        }
        
        .video-thumbnail iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .video-info {
            padding: 20px;
        }
        
        .video-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        
        .video-stats {
            color: #666;
            font-size: 0.9rem;
        }
        
        /* Footer */
        .footer { 
            background: #2c3e50; 
            color: white; 
            padding: 60px 0 30px; 
            text-align: center; 
        }
        
        .footer-content {
            margin-bottom: 30px;
        }
        
        .footer h3 {
            font-size: 1.5rem;
            margin-bottom: 15px;
        }
        
        .footer p {
            color: #bdc3c7;
            max-width: 600px;
            margin: 0 auto 20px;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .social-link {
            display: inline-block;
            width: 50px;
            height: 50px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .social-link:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Responsive */
        @media (max-width: 768px) { 
            .hero h1 { font-size: 2.5rem; } 
            .hero p { font-size: 1.1rem; }
            .stats-grid { grid-template-columns: 1fr; }
            .videos-grid { grid-template-columns: 1fr; }
            .stat-card { padding: 30px 20px; }
        }
        
        /* Loading animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="logo">${channelTitle}</div>
            <a href="#subscribe" class="subscribe-btn">Subscribe Now</a>
        </nav>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>${channelTitle}</h1>
                <p>${channelDescription}</p>
                <a href="https://www.youtube.com/${channelData?.customUrl || '@channel'}" target="_blank" class="subscribe-btn" id="subscribe">
                    Subscribe • ${parseInt(subscriberCount).toLocaleString()} Subscribers
                </a>
            </div>
        </div>
    </section>

    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${parseInt(subscriberCount).toLocaleString()}</span>
                    <div class="stat-label">Subscribers</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${channelData?.videoCount || '300'}+</span>
                    <div class="stat-label">Videos</div>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${channelData?.viewCount ? (parseInt(channelData.viewCount) / 1000000).toFixed(1) + 'M' : '94M'}</span>
                    <div class="stat-label">Total Views</div>
                </div>
            </div>
        </div>
    </section>

    ${videos.length > 0 ? `
    <section class="videos-section">
        <div class="container">
            <h2 class="section-title">Latest Videos</h2>
            <div class="videos-grid">
                ${videos.slice(0, 6).map(video => `
                    <div class="video-card">
                        <div class="video-thumbnail">
                            <iframe src="${video.embedUrl}" title="${video.title}" frameborder="0" allowfullscreen></iframe>
                        </div>
                        <div class="video-info">
                            <h3 class="video-title">${video.title}</h3>
                            <div class="video-stats">${parseInt(video.viewCount || 0).toLocaleString()} views</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <h3>${channelTitle}</h3>
                <p>Request: "${userRequest}"</p>
                <p>Thank you for visiting our professional channel website!</p>
            </div>
            <div class="social-links">
                <a href="https://www.youtube.com/${channelData?.customUrl || '@channel'}" target="_blank" class="social-link">▶</a>
                <a href="#" class="social-link">📧</a>
                <a href="#" class="social-link">📱</a>
            </div>
            <p style="color: #7f8c8d; margin-top: 20px;">&copy; 2024 ${channelTitle}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // Enhanced interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Animate stats on scroll
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                    }
                });
            });

            document.querySelectorAll('.stat-card, .video-card').forEach(card => {
                observer.observe(card);
            });

            // Add loading states for external content
            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.addEventListener('load', function() {
                    this.style.opacity = '1';
                });
            });

            console.log('Enhanced ${channelTitle} website loaded successfully!');
            console.log('User request: "${userRequest}"');
        });
    </script>
</body>
</html>`;

  return {
    code: enhancedCode,
    response: `Enhanced professional website generated for ${channelTitle} - modern design with advanced features and animations!`
  };
}
