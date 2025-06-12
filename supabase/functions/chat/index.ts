
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, projectId, channelData, chatHistory, generateCode } = await req.json();

    console.log('📨 Chat request received:', { 
      message: message?.substring(0, 100) + '...', 
      projectId, 
      generateCode,
      hasChannelData: !!channelData 
    });

    // Get OpenRouter API key from environment
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterKey) {
      console.error('❌ No OpenRouter API key found in environment');
      
      // Return fallback response with code generation
      const fallbackCode = generateFallbackWebsite(channelData, message);
      
      return new Response(
        JSON.stringify({ 
          reply: `🚀 I'll create a ${channelData ? `website for ${channelData.title}` : 'website'} based on your request!\n\n` +
                 `✨ **Generating:**\n• Modern responsive design\n• Mobile-friendly layout\n• Professional styling\n• Interactive elements\n\n` +
                 `⚡ **Deployment:** Code generated and ready for deployment!`,
          feature: 'website',
          generatedCode: fallbackCode,
          codeDescription: `Modern responsive website${channelData ? ` for ${channelData.title}` : ''} with interactive elements`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build context for AI
    let systemPrompt = `You are an AI website builder assistant. You create modern, responsive websites with HTML, CSS, and JavaScript. Always generate complete, functional websites.`;
    
    if (channelData) {
      systemPrompt += `\n\nYouTube Channel Context:
- Channel: ${channelData.title}
- Subscribers: ${channelData.subscriberCount}
- Description: ${channelData.description}
- Videos: ${channelData.videoCount}
- Views: ${channelData.viewCount}

Create a website that reflects this channel's brand and content.`;
    }

    systemPrompt += `\n\nAlways respond with:
1. A friendly message about what you're creating
2. Include the phrase "Generating website code..." in your response
3. Be specific about the features you're adding

The user's request is: "${message}"`;

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(chatHistory || []).slice(-3).map(msg => ({
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
        "HTTP-Referer": "https://ldcipixxhnrepgkyzmno.supabase.co",
        "X-Title": "AI Website Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: aiMessages,
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const reply = aiResponse.choices[0]?.message?.content || "I'm creating your website now!";

    console.log('✅ AI response received');

    // Always generate code for website requests
    const shouldGenerateCode = true;
    let generatedCode = '';
    let codeDescription = '';
    let feature = 'website';

    if (shouldGenerateCode) {
      feature = 'website';
      codeDescription = `Modern responsive website${channelData ? ` for ${channelData.title}` : ''} based on: ${message}`;
      generatedCode = generateAdvancedWebsite(channelData, message);
      console.log('✅ Website code generated');
    }

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
    
    // Enhanced fallback with code generation
    const { channelData, message } = await req.json().catch(() => ({}));
    const fallbackCode = generateFallbackWebsite(channelData, message || 'Create a website');
    
    return new Response(
      JSON.stringify({ 
        reply: `🚀 I'll create a ${channelData ? `website for ${channelData.title}` : 'website'} for you!\n\n` +
               `✨ **Features:**\n• Modern responsive design\n• Mobile-friendly layout\n• Professional styling\n• Interactive elements\n\n` +
               `⚡ **Status:** Code generated and ready for deployment!`,
        feature: 'website',
        generatedCode: fallbackCode,
        codeDescription: `Modern responsive website${channelData ? ` for ${channelData.title}` : ''} with interactive elements`
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function generateAdvancedWebsite(channelData: any, userRequest: string): string {
  const title = channelData?.title || 'AI Generated Website';
  const description = channelData?.description || 'A modern, responsive website built with AI';
  
  // Analyze user request for styling preferences
  const isDark = userRequest.toLowerCase().includes('dark') || userRequest.toLowerCase().includes('black');
  const isGaming = userRequest.toLowerCase().includes('gaming') || userRequest.toLowerCase().includes('game');
  const isBusiness = userRequest.toLowerCase().includes('business') || userRequest.toLowerCase().includes('professional');
  const isCreative = userRequest.toLowerCase().includes('creative') || userRequest.toLowerCase().includes('artistic');
  
  let primaryColor = '#667eea';
  let secondaryColor = '#764ba2';
  let accentColor = '#ff6b6b';
  
  if (isDark) {
    primaryColor = '#1a1a1a';
    secondaryColor = '#2d3748';
    accentColor = '#e53e3e';
  } else if (isGaming) {
    primaryColor = '#0f3460';
    secondaryColor = '#16213e';
    accentColor = '#0ea5e9';
  } else if (isBusiness) {
    primaryColor = '#1e40af';
    secondaryColor = '#1e293b';
    accentColor = '#059669';
  } else if (isCreative) {
    primaryColor = '#7c3aed';
    secondaryColor = '#db2777';
    accentColor = '#f59e0b';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: ${secondaryColor};
            --accent-color: ${accentColor};
            --text-color: ${isDark ? '#ffffff' : '#333333'};
            --bg-color: ${isDark ? '#000000' : '#ffffff'};
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
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
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
        
        .nav-links a::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .nav-links a:hover::before {
            left: 100%;
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
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
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
            box-shadow: 0 15px 35px rgba(255, 107, 107, 0.3);
            margin: 0 10px;
            position: relative;
            overflow: hidden;
        }
        
        .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s;
        }
        
        .cta-button:hover::before {
            left: 100%;
        }
        
        .cta-button:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 25px 50px rgba(255, 107, 107, 0.4);
        }
        
        .cta-button.secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
            box-shadow: 0 15px 35px rgba(255, 255, 255, 0.2);
        }
        
        .cta-button.secondary:hover {
            background: white;
            color: var(--primary-color);
            box-shadow: 0 25px 50px rgba(255, 255, 255, 0.3);
        }
        
        .features {
            padding: 8rem 0;
            background: var(--bg-color);
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
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            backdrop-filter: blur(15px);
            padding: 3rem;
            border-radius: 25px;
            text-align: center;
            color: var(--text-color);
            transform: translateY(0);
            transition: all 0.4s ease;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            position: relative;
            overflow: hidden;
        }
        
        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, var(--accent-color), transparent);
            opacity: 0;
            transition: opacity 0.4s ease;
            z-index: -1;
        }
        
        .feature-card:hover::before {
            opacity: 0.1;
        }
        
        .feature-card:hover {
            transform: translateY(-20px) scale(1.02);
            box-shadow: 0 30px 60px rgba(0,0,0,0.2);
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
        
        .stats-section {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            padding: 6rem 0;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .stats-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
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
            background: rgba(255,255,255,0.1);
            padding: 3rem;
            border-radius: 20px;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.2);
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-10px);
            background: rgba(255,255,255,0.15);
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
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 2rem;
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
                <li><a href="#stats">Stats</a></li>
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
                ${channelData ? `<a href="https://youtube.com/channel/${channelData.id}" class="cta-button secondary" target="_blank">Visit Channel</a>` : ''}
            </div>
        </div>
        <div class="scroll-indicator">↓</div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">Amazing Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <span class="feature-icon">🚀</span>
                    <h3>Lightning Fast</h3>
                    <p>Built with cutting-edge technology for optimal performance and blazing-fast load times that keep users engaged.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <h3>Mobile First</h3>
                    <p>Fully responsive design that looks stunning on all devices, from smartphones to desktops, ensuring a perfect experience everywhere.</p>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">✨</span>
                    <h3>Interactive Design</h3>
                    <p>Engaging animations and interactive elements that create memorable user experiences and keep visitors coming back.</p>
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
                <p>Ready to build the next big thing? Get in touch and let's make it happen together.</p>
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

        // Advanced header effects
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            // Change header appearance on scroll
            if (currentScrollY > 100) {
                header.style.background = 'rgba(0, 0, 0, 0.9)';
                header.style.backdropFilter = 'blur(20px)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.1)';
                header.style.backdropFilter = 'blur(15px)';
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

        // Animate feature cards
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = \`all 0.8s ease \${index * 0.2}s\`;
            observer.observe(card);
        });

        // Animate stats
        document.querySelectorAll('.stat-item').forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = \`all 0.6s ease \${index * 0.1}s\`;
            observer.observe(item);
        });

        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            const rate = scrolled * -0.3;
            
            if (hero && scrolled < window.innerHeight) {
                hero.style.transform = \`translateY(\${rate}px)\`;
            }
        });

        // Counter animation for stats
        function animateCounter(element, target) {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current).toLocaleString();
                }
            }, 20);
        }

        // Trigger counter animations when stats section is visible
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const numbers = entry.target.querySelectorAll('.stat-number');
                    numbers.forEach(number => {
                        const target = parseInt(number.textContent.replace(/,/g, ''));
                        if (!isNaN(target)) {
                            animateCounter(number, target);
                        }
                    });
                    statsObserver.unobserve(entry.target);
                }
            });
        });

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            statsObserver.observe(statsSection);
        }

        // Add loading animation
        window.addEventListener('load', () => {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });

        // Add cursor trail effect
        document.addEventListener('mousemove', (e) => {
            const trail = document.createElement('div');
            trail.style.position = 'fixed';
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
            trail.style.width = '6px';
            trail.style.height = '6px';
            trail.style.background = 'rgba(255, 107, 107, 0.7)';
            trail.style.borderRadius = '50%';
            trail.style.pointerEvents = 'none';
            trail.style.zIndex = '9999';
            trail.style.animation = 'trailFade 0.5s ease-out forwards';
            
            document.body.appendChild(trail);
            
            setTimeout(() => {
                document.body.removeChild(trail);
            }, 500);
        });

        // Add trail fade animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes trailFade {
                to {
                    opacity: 0;
                    transform: scale(0);
                }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
}

function generateFallbackWebsite(channelData: any, userRequest: string): string {
  return generateAdvancedWebsite(channelData, userRequest || 'Create a modern website');
}
