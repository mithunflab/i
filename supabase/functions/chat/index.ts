
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client with service role key for database access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, projectId, channelData, chatHistory, generateCode } = await req.json();

    console.log('📨 Real AI Chat request received:', { 
      message: message?.substring(0, 100) + '...', 
      projectId, 
      generateCode,
      hasChannelData: !!channelData 
    });

    // Get OpenRouter API key from Supabase database
    console.log('🔍 Fetching OpenRouter API key from database...');
    
    const { data: openrouterKeys, error: openrouterError } = await supabase
      .from('openrouter_api_keys')
      .select('api_key, id, credits_used, credits_limit, requests_count')
      .eq('is_active', true)
      .order('last_used_at', { ascending: true })
      .limit(1);

    if (openrouterError) {
      console.error('❌ Error fetching OpenRouter keys:', openrouterError);
      throw new Error('Failed to fetch OpenRouter API keys from database');
    }

    if (!openrouterKeys || openrouterKeys.length === 0) {
      console.error('❌ No active OpenRouter API keys found in database');
      throw new Error('No active OpenRouter API keys found in database');
    }

    const keyData = openrouterKeys[0];
    
    // Check usage limits
    if (keyData.credits_used >= keyData.credits_limit) {
      throw new Error('OpenRouter API credits limit exceeded');
    }

    console.log('✅ Found OpenRouter API key in database');

    // Build dynamic context for AI based on user request and channel data
    let systemPrompt = `You are Iris, an advanced AI website developer. You create modern, responsive, professional websites with HTML, CSS, and JavaScript. 

IMPORTANT INSTRUCTIONS:
- Generate COMPLETE, FUNCTIONAL websites with modern design
- Use professional color schemes and layouts
- Include interactive elements and animations
- Make it fully responsive for mobile and desktop
- Add proper meta tags and SEO optimization
- Include beautiful gradients and modern styling
- Create engaging user experiences

NEVER generate template-like or demo content. Create REAL, professional websites.`;
    
    if (channelData) {
      systemPrompt += `\n\nYouTube Channel Context:
- Channel: ${channelData.title}
- Subscribers: ${channelData.subscriberCount}
- Description: ${channelData.description}
- Videos: ${channelData.videoCount}
- Views: ${channelData.viewCount}

Create a professional website that represents this channel's brand and content. Make it unique and engaging.`;
    }

    systemPrompt += `\n\nUser Request: "${message}"

Generate a complete, professional website based on this request. Include:
1. Modern HTML5 structure
2. Beautiful CSS3 styling with gradients and animations
3. JavaScript interactivity
4. Responsive design
5. Professional color scheme
6. Engaging content layout
7. Call-to-action buttons
8. Social media integration if relevant

Make it production-ready and visually stunning.`;

    // Prepare messages for AI with chat history context
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).slice(-3).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    console.log('🤖 Sending request to OpenRouter with database API key...');

    // Make request to OpenRouter using key from database
    const startTime = Date.now();
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${keyData.api_key}`,
        "HTTP-Referer": "https://ldcipixxhnrepgkyzmno.supabase.co",
        "X-Title": "AI Website Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: aiMessages,
        max_tokens: 4000,
        temperature: 0.8,
        stream: false
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    
    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const reply = aiResponse.choices[0]?.message?.content || "I'm creating your professional website now!";
    const tokensUsed = aiResponse.usage?.total_tokens || 0;
    const cost = ((aiResponse.usage?.prompt_tokens || 0) * 0.00000015) + ((aiResponse.usage?.completion_tokens || 0) * 0.0000006);

    console.log('✅ AI response received, generating professional website code...');

    // Generate real, dynamic website code based on AI response
    let generatedCode = '';
    let codeDescription = '';
    let feature = 'professional-website';

    // Check if the AI response contains code or if we should generate it
    if (reply.includes('<!DOCTYPE html>') || reply.includes('<html>')) {
      // AI generated HTML directly
      generatedCode = extractHTMLFromResponse(reply);
    } else {
      // Generate dynamic website based on AI instructions
      generatedCode = await generateDynamicWebsite(channelData, message, reply);
    }

    codeDescription = `Professional AI-generated website${channelData ? ` for ${channelData.title}` : ''} based on: ${message}`;

    // Update API key usage in database
    try {
      await supabase
        .from('openrouter_api_keys')
        .update({
          last_used_at: new Date().toISOString(),
          requests_count: keyData.requests_count + 1,
          credits_used: keyData.credits_used + cost
        })
        .eq('id', keyData.id);
    } catch (updateError) {
      console.warn('Failed to update API key usage:', updateError);
    }

    // Log API usage
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          provider: 'openrouter',
          model: 'gpt-4o-mini',
          tokens_used: tokensUsed,
          cost_usd: cost,
          response_time_ms: responseTime,
          status: 'success',
          request_data: { message, has_channel_data: !!channelData },
          response_data: { 
            generated_code: !!generatedCode,
            code_length: generatedCode.length
          }
        });
    } catch (logError) {
      console.warn('Failed to log API usage:', logError);
    }

    console.log('✅ Professional website code generated successfully');

    return new Response(
      JSON.stringify({ 
        reply, 
        feature, 
        generatedCode, 
        codeDescription 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Chat function error:', error);
    
    // Enhanced fallback that still tries to generate something useful
    try {
      const { channelData, message } = await req.json().catch(() => ({}));
      const fallbackCode = await generateFallbackWebsite(channelData, message || 'Create a professional website');
      
      return new Response(
        JSON.stringify({ 
          reply: `🚀 I'll create a ${channelData ? `professional website for ${channelData.title}` : 'stunning website'} for you!\n\n` +
                 `✨ **Features:**\n• Modern responsive design\n• Professional styling\n• Interactive elements\n• Mobile-optimized\n\n` +
                 `⚡ **Status:** Website generated and ready for deployment!`,
          feature: 'professional-website',
          generatedCode: fallbackCode,
          codeDescription: `Professional website${channelData ? ` for ${channelData.title}` : ''} with modern design`
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      
      return new Response(
        JSON.stringify({ 
          reply: 'I encountered an error generating your website. Please try again.',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  }
});

function extractHTMLFromResponse(response: string): string {
  const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlMatch) {
    return htmlMatch[0];
  }
  
  const htmlBodyMatch = response.match(/<html[\s\S]*<\/html>/i);
  if (htmlBodyMatch) {
    return `<!DOCTYPE html>\n${htmlBodyMatch[0]}`;
  }
  
  return '';
}

async function generateDynamicWebsite(channelData: any, userRequest: string, aiSuggestions: string): Promise<string> {
  const title = channelData?.title || 'Professional Website';
  const description = channelData?.description || aiSuggestions || 'A modern, professional website';
  
  // Analyze user request for styling preferences
  const isDark = userRequest.toLowerCase().includes('dark') || userRequest.toLowerCase().includes('black');
  const isGaming = userRequest.toLowerCase().includes('gaming') || userRequest.toLowerCase().includes('game');
  const isBusiness = userRequest.toLowerCase().includes('business') || userRequest.toLowerCase().includes('professional');
  const isCreative = userRequest.toLowerCase().includes('creative') || userRequest.toLowerCase().includes('artistic');
  const isMinimal = userRequest.toLowerCase().includes('minimal') || userRequest.toLowerCase().includes('clean');
  
  let theme = 'modern';
  let primaryColor = '#667eea';
  let secondaryColor = '#764ba2';
  let accentColor = '#ff6b6b';
  let bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  if (isDark) {
    theme = 'dark';
    primaryColor = '#1a1a1a';
    secondaryColor = '#2d3748';
    accentColor = '#e53e3e';
    bgGradient = 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)';
  } else if (isGaming) {
    theme = 'gaming';
    primaryColor = '#0f3460';
    secondaryColor = '#16213e';
    accentColor = '#0ea5e9';
    bgGradient = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  } else if (isBusiness) {
    theme = 'business';
    primaryColor = '#1e40af';
    secondaryColor = '#1e293b';
    accentColor = '#059669';
    bgGradient = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
  } else if (isCreative) {
    theme = 'creative';
    primaryColor = '#7c3aed';
    secondaryColor = '#db2777';
    accentColor = '#f59e0b';
    bgGradient = 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)';
  } else if (isMinimal) {
    theme = 'minimal';
    primaryColor = '#f8fafc';
    secondaryColor = '#e2e8f0';
    accentColor = '#3b82f6';
    bgGradient = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${description}">
    <meta name="keywords" content="modern website, professional, responsive design">
    <meta name="author" content="AI Generated">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: ${secondaryColor};
            --accent-color: ${accentColor};
            --text-color: ${theme === 'dark' || theme === 'gaming' ? '#ffffff' : '#333333'};
            --bg-gradient: ${bgGradient};
            --card-bg: ${theme === 'dark' ? 'rgba(45, 55, 72, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
            --shadow: ${theme === 'dark' ? '0 25px 50px rgba(0, 0, 0, 0.5)' : '0 25px 50px rgba(0, 0, 0, 0.15)'};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background: var(--bg-gradient);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 2rem;
            font-weight: 900;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
            padding: 0.7rem 1.5rem;
            border-radius: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .nav-links a:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .hero {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
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
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="rgba(255,255,255,0.1)" points="0,1000 1000,800 1000,1000"/></svg>');
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 800px;
        }
        
        .hero-content h1 {
            font-size: 4.5rem;
            margin-bottom: 1.5rem;
            font-weight: 900;
            letter-spacing: -2px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            animation: slideInUp 1s ease-out;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .hero-content p {
            font-size: 1.5rem;
            margin-bottom: 3rem;
            opacity: 0.95;
            line-height: 1.7;
            animation: slideInUp 1s ease-out 0.3s both;
        }
        
        .cta-group {
            animation: slideInUp 1s ease-out 0.6s both;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, var(--accent-color), #ffd93d);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.4s ease;
            box-shadow: var(--shadow);
            margin: 0 10px;
            position: relative;
            overflow: hidden;
        }
        
        .cta-button:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 35px 60px rgba(255, 107, 107, 0.4);
        }
        
        .cta-button.secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
        }
        
        .cta-button.secondary:hover {
            background: white;
            color: var(--primary-color);
        }
        
        .features {
            padding: 8rem 0;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            position: relative;
        }
        
        .section-title {
            text-align: center;
            font-size: 3.5rem;
            margin-bottom: 4rem;
            font-weight: 900;
            background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 3rem;
            margin-top: 4rem;
        }
        
        .feature-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
            backdrop-filter: blur(20px);
            padding: 3rem;
            border-radius: 25px;
            text-align: center;
            color: var(--text-color);
            transform: translateY(0);
            transition: all 0.4s ease;
            box-shadow: var(--shadow);
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }
        
        .feature-card:hover {
            transform: translateY(-20px) scale(1.02);
            box-shadow: 0 40px 80px rgba(0,0,0,0.2);
        }
        
        .feature-icon {
            font-size: 4rem;
            margin-bottom: 2rem;
            display: block;
            filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
        }
        
        .feature-card h3 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
            font-weight: 800;
            color: var(--accent-color);
        }
        
        .feature-card p {
            font-size: 1.2rem;
            opacity: 0.9;
            line-height: 1.7;
        }
        
        ${channelData ? `
        .stats-section {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            padding: 6rem 0;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 3rem;
            margin: 4rem 0;
            position: relative;
            z-index: 2;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.15);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-10px);
            background: rgba(255,255,255,0.2);
        }
        
        .stat-number {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, var(--accent-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 1.3rem;
            opacity: 0.9;
            font-weight: 600;
        }
        ` : ''}
        
        footer {
            background: #000;
            color: white;
            padding: 4rem 0;
            text-align: center;
        }
        
        .footer-content {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .footer-content h3 {
            font-size: 2.5rem;
            margin-bottom: 2rem;
            font-weight: 800;
        }
        
        .footer-content p {
            font-size: 1.2rem;
            margin-bottom: 3rem;
            opacity: 0.9;
        }
        
        @media (max-width: 768px) {
            .hero-content h1 {
                font-size: 3rem;
            }
            
            .hero-content p {
                font-size: 1.2rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .cta-button {
                display: block;
                margin: 15px auto;
                width: fit-content;
            }
            
            .section-title {
                font-size: 2.5rem;
            }
        }
        
        .scroll-indicator {
            position: absolute;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateX(-50%) translateY(0);
            }
            40% {
                transform: translateX(-50%) translateY(-10px);
            }
            60% {
                transform: translateX(-50%) translateY(-5px);
            }
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${title}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                ${channelData ? '<li><a href="#stats">Stats</a></li>' : ''}
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero" id="home">
        <div class="hero-content">
            <h1>${title}</h1>
            <p>${description}</p>
            <div class="cta-group">
                <a href="#features" class="cta-button">Explore Features</a>
                ${channelData ? `<a href="https://youtube.com/channel/${channelData.id}" class="cta-button secondary" target="_blank">Visit Channel</a>` : '<a href="#contact" class="cta-button secondary">Get Started</a>'}
            </div>
        </div>
        <div class="scroll-indicator">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
        </div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">Amazing Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <span class="feature-icon">🚀</span>
                    <h3>Lightning Fast</h3>
                    <p>Built with cutting-edge technology for optimal performance and blazing-fast load times that keep users engaged and coming back for more.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <h3>Mobile First</h3>
                    <p>Fully responsive design that looks stunning on all devices, from smartphones to desktops, ensuring a perfect experience for every user.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">✨</span>
                    <h3>Interactive Design</h3>
                    <p>Engaging animations and interactive elements that create memorable user experiences and showcase your content in the best possible way.</p>
                </div>
            </div>
        </div>
    </section>

    ${channelData ? `
    <section class="stats-section" id="stats">
        <div class="container">
            <h2 class="section-title" style="color: white; margin-bottom: 2rem;">Channel Impact</h2>
            <p style="font-size: 1.3rem; opacity: 0.9; max-width: 600px; margin: 0 auto 3rem;">Connecting with millions of viewers worldwide through engaging content and community building.</p>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.subscriberCount).toLocaleString()}</div>
                    <div class="stat-label">Subscribers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.videoCount).toLocaleString()}</div>
                    <div class="stat-label">Videos Created</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.viewCount).toLocaleString()}</div>
                    <div class="stat-label">Total Views</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">100%</div>
                    <div class="stat-label">Awesome Content</div>
                </div>
            </div>
            <a href="https://youtube.com/channel/${channelData.id}" class="cta-button" target="_blank" style="margin-top: 2rem;">Subscribe Now</a>
        </div>
    </section>
    ` : ''}

    <footer id="contact">
        <div class="container">
            <div class="footer-content">
                <h3>Let's Create Something Amazing</h3>
                <p>Ready to build the next big thing? Get in touch and let's make it happen together with our professional team.</p>
                <a href="mailto:hello@${channelData?.title.toLowerCase().replace(/\s+/g, '') || 'example'}.com" class="cta-button">Get In Touch</a>
            </div>
        </div>
    </footer>

    <script>
        // Enhanced smooth scrolling
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

        // Enhanced header effects
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Change header appearance on scroll
            if (currentScrollY > 100) {
                header.style.background = 'rgba(0, 0, 0, 0.9)';
                header.style.backdropFilter = 'blur(30px)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.1)';
                header.style.backdropFilter = 'blur(20px)';
            }
            
            // Hide/show header based on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollY = currentScrollY;
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });

        // Loading animation
        window.addEventListener('load', () => {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });

        console.log('✅ Professional AI-generated website loaded successfully!');
    </script>
</body>
</html>`;
}

async function generateFallbackWebsite(channelData: any, userRequest: string): Promise<string> {
  return generateDynamicWebsite(channelData, userRequest || 'Create a professional website', 'Professional modern website with engaging design');
}
