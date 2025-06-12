
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, projectId, channelData, chatHistory, generateCode } = await req.json();

    console.log('📨 Chat request received:', { message, projectId, generateCode });

    // Get OpenRouter API key from environment
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterKey) {
      console.error('❌ No OpenRouter API key found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    let systemPrompt = `You are an AI assistant that helps users build websites. You are creative, helpful, and can generate HTML, CSS, and JavaScript code.`;
    
    if (channelData) {
      systemPrompt += `\n\nUser's YouTube Channel Info:
- Channel: ${channelData.title}
- Subscribers: ${channelData.subscriberCount}
- Description: ${channelData.description}
- Videos: ${channelData.videoCount}`;
    }

    if (generateCode) {
      systemPrompt += `\n\nThe user wants you to generate website code. Create modern, responsive HTML with inline CSS and JavaScript. Make it visually appealing and functional.`;
    }

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-3).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    console.log('🤖 Sending request to OpenRouter...');

    // Make request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "AI Website Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: aiMessages,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const reply = aiResponse.choices[0]?.message?.content || "I'm having trouble generating a response right now.";

    // Determine if this should generate code
    let generatedCode = '';
    let codeDescription = '';
    let feature = '';

    if (generateCode || message.toLowerCase().includes('website') || message.toLowerCase().includes('create') || message.toLowerCase().includes('build')) {
      feature = 'website';
      codeDescription = `Generated a website based on: ${message}`;
      
      // Generate actual HTML code
      generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'My Website'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .hero { 
            text-align: center; 
            background: rgba(255,255,255,0.95); 
            padding: 4rem 2rem; 
            border-radius: 20px; 
            margin: 2rem 0;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .hero h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: 800;
        }
        .hero p {
            font-size: 1.3rem;
            color: #666;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-button { 
            display: inline-block; 
            padding: 15px 35px; 
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            color: white; 
            text-decoration: none; 
            border-radius: 50px; 
            margin: 10px;
            transition: all 0.3s ease;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .cta-button:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
        }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
            margin: 3rem 0; 
        }
        .feature-card { 
            background: rgba(255,255,255,0.95); 
            padding: 2rem; 
            border-radius: 20px; 
            text-align: center; 
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .feature-card:hover { 
            transform: translateY(-10px); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .youtube-section {
            background: rgba(255,255,255,0.95);
            padding: 3rem;
            border-radius: 20px;
            margin: 3rem 0;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .container { padding: 10px; }
            .hero { padding: 2rem 1rem; }
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <section class="hero">
            <h1>Welcome to ${channelData?.title || 'My Website'}</h1>
            <p>${channelData?.description || 'Creating amazing content and experiences for our community'}</p>
            <a href="#subscribe" class="cta-button pulse">🔔 Subscribe Now</a>
            <a href="#content" class="cta-button">📺 Latest Content</a>
        </section>
        
        <section class="features">
            <div class="feature-card">
                <div class="feature-icon">🎬</div>
                <h3>Latest Content</h3>
                <p>Stay updated with our newest videos, tutorials, and creative projects.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h3>Community</h3>
                <p>Join our growing community of passionate creators and fans worldwide.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3>Exclusive Access</h3>
                <p>Get early access to content and behind-the-scenes material.</p>
            </div>
        </section>
        
        <section class="youtube-section" id="content">
            <h2>🚀 ${channelData?.title || 'My Channel'}</h2>
            <p style="font-size: 1.1rem; margin: 1rem 0;">Subscribe for amazing content!</p>
            ${channelData?.subscriberCount ? `<p><strong>${parseInt(channelData.subscriberCount).toLocaleString()} subscribers</strong> can't be wrong!</p>` : ''}
            <br>
            <a href="${channelData ? `https://youtube.com/channel/${channelData.id}` : '#'}" class="cta-button" target="_blank">Visit YouTube Channel</a>
        </section>
    </div>
    
    <script>
        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Animation on scroll
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

        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease ' + (index * 0.2) + 's';
            observer.observe(card);
        });
    </script>
</body>
</html>`;
    }

    console.log('✅ Chat response generated successfully');

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
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
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
});
