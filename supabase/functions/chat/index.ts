
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, channelData, chatHistory = [], generateCode = true } = await req.json();
    
    console.log('📨 Real AI Chat request received:', {
      message: message.substring(0, 50) + "...",
      projectId,
      generateCode,
      hasChannelData: !!channelData
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenRouter API key from database
    console.log('🔍 Fetching OpenRouter API key from database...');
    const { data: openrouterKeys, error: keyError } = await supabase
      .from('openrouter_api_keys')
      .select('*')
      .eq('is_active', true)
      .order('last_used_at', { ascending: true })
      .limit(1);

    if (keyError || !openrouterKeys || openrouterKeys.length === 0) {
      throw new Error('No active OpenRouter API keys found');
    }

    const apiKey = openrouterKeys[0].api_key;
    console.log('✅ Found OpenRouter API key in database');

    // Create comprehensive prompt for website generation
    const systemPrompt = `You are an expert web developer that creates stunning, modern websites. When a user requests a website, you MUST:

1. Generate complete, functional HTML with embedded CSS and JavaScript
2. Create visually stunning designs with modern aesthetics
3. Use vibrant colors, gradients, and animations
4. Make the website fully responsive and mobile-friendly
5. Include interactive elements and smooth animations
6. Focus on the specific request and channel data provided

Channel Info: ${channelData ? `Title: ${channelData.title}, Subscribers: ${channelData.subscriberCount}, Description: ${channelData.description}` : 'Generic website'}

User Request: ${message}

Generate a complete HTML file that is visually stunning and matches the user's request. Include proper meta tags, responsive design, and modern styling.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-3).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenRouter API
    console.log('🤖 Sending request to OpenRouter with database API key...');
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "AI Website Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 4000,
        temperature: 0.8,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    // Extract HTML code from the response
    let generatedCode = '';
    const htmlMatch = aiReply.match(/```html\n([\s\S]*?)\n```/) || aiReply.match(/```\n([\s\S]*?)\n```/);
    
    if (htmlMatch) {
      generatedCode = htmlMatch[1];
    } else if (aiReply.includes('<!DOCTYPE html') || aiReply.includes('<html')) {
      // If the entire response is HTML
      generatedCode = aiReply;
    } else {
      // Generate a stunning website based on the AI response
      generatedCode = generateStunningWebsite(message, channelData, aiReply);
    }

    // Clean and validate the HTML
    generatedCode = cleanHTML(generatedCode);

    // Update API key usage
    await supabase
      .from('openrouter_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        requests_count: openrouterKeys[0].requests_count + 1
      })
      .eq('id', openrouterKeys[0].id);

    console.log('✅ AI response received, generating website code...');

    return new Response(JSON.stringify({
      reply: `I've created a stunning website for you! The code has been generated and is ready for deployment.`,
      generatedCode,
      codeDescription: `Modern, responsive website with vibrant design`,
      feature: 'website',
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Chat function error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      reply: `Sorry, I encountered an error: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateStunningWebsite(userRequest: string, channelData: any, aiResponse: string): string {
  const title = channelData?.title || 'Amazing Website';
  const description = channelData?.description || userRequest;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            color: white;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            padding: 60px 0;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
        }
        
        .header-content {
            position: relative;
            z-index: 2;
        }
        
        h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            margin-bottom: 20px;
            background: linear-gradient(45deg, #fff, #f093fb, #667eea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        
        .subtitle {
            font-size: 1.3rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .cta-button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(45deg, #ff6b6b, #ee5a24, #feca57);
            border: none;
            border-radius: 50px;
            color: white;
            font-size: 1.1rem;
            font-weight: bold;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .cta-button:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 60px 0;
        }
        
        .feature-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .feature-card:hover::before {
            left: 100%;
        }
        
        .feature-card:hover {
            transform: translateY(-15px) scale(1.02);
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 20px;
            display: block;
        }
        
        .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #fff;
        }
        
        .feature-card p {
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 60px 0;
            flex-wrap: wrap;
        }
        
        .stat-item {
            text-align: center;
            padding: 20px;
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(45deg, #feca57, #ff9ff3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.8;
            margin-top: 10px;
        }
        
        .footer {
            text-align: center;
            padding: 40px 0;
            margin-top: 60px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .features {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .stats {
                flex-direction: column;
                gap: 20px;
            }
        }
        
        .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
            animation: float-particle 6s infinite ease-in-out;
        }
        
        @keyframes float-particle {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
            50% { transform: translateY(-100px) rotate(180deg); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-content">
                <h1>${title}</h1>
                <p class="subtitle">${description}</p>
                <button class="cta-button" onclick="alert('Welcome to ${title}!')">
                    Get Started ✨
                </button>
            </div>
        </header>
        
        <section class="features">
            <div class="feature-card">
                <span class="feature-icon">🚀</span>
                <h3>Lightning Fast</h3>
                <p>Experience blazing fast performance with our optimized design and cutting-edge technology.</p>
            </div>
            <div class="feature-card">
                <span class="feature-icon">🎨</span>
                <h3>Beautiful Design</h3>
                <p>Stunning visuals and smooth animations that captivate your audience and enhance user experience.</p>
            </div>
            <div class="feature-card">
                <span class="feature-icon">📱</span>
                <h3>Mobile First</h3>
                <p>Perfectly responsive design that looks amazing on all devices, from phones to desktops.</p>
            </div>
        </section>
        
        ${channelData ? `
        <section class="stats">
            <div class="stat-item">
                <div class="stat-number">${parseInt(channelData.subscriberCount).toLocaleString()}</div>
                <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${parseInt(channelData.videoCount).toLocaleString()}</div>
                <div class="stat-label">Videos</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${parseInt(channelData.viewCount).toLocaleString()}</div>
                <div class="stat-label">Total Views</div>
            </div>
        </section>
        ` : ''}
        
        <footer class="footer">
            <h3>Ready to Get Started?</h3>
            <p>Join thousands of satisfied users and experience the difference!</p>
            <button class="cta-button" style="margin-top: 20px;" onclick="alert('Thanks for your interest!')">
                Contact Us 💫
            </button>
        </footer>
    </div>
    
    <script>
        // Create floating particles
        function createParticle() {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 6 + 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 6000);
        }
        
        // Create particles periodically
        setInterval(createParticle, 300);
        
        // Add scroll animations
        window.addEventListener('scroll', () => {
            const cards = document.querySelectorAll('.feature-card');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    card.style.transform = 'translateY(0)';
                    card.style.opacity = '1';
                }
            });
        });
        
        // Initialize animations
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.feature-card');
            cards.forEach((card, index) => {
                card.style.transform = 'translateY(50px)';
                card.style.opacity = '0';
                card.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    card.style.transform = 'translateY(0)';
                    card.style.opacity = '1';
                }, index * 200);
            });
        });
    </script>
</body>
</html>`;
}

function cleanHTML(html: string): string {
  // Remove any markdown code block markers
  html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');
  
  // Ensure we have a complete HTML document
  if (!html.includes('<!DOCTYPE html')) {
    if (html.includes('<html')) {
      html = '<!DOCTYPE html>\n' + html;
    }
  }
  
  // Basic validation - ensure we have html, head, and body tags
  if (!html.includes('<html')) {
    html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Website</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }
  
  return html.trim();
}
