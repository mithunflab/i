
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

    // Create comprehensive prompt for professional website generation
    const systemPrompt = `You are an expert web developer that creates STUNNING, PROFESSIONAL websites like those built by Lovable, Bolt, and other modern web builders. 

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, FUNCTIONAL HTML with embedded CSS and JavaScript
2. Create VISUALLY STUNNING designs with modern aesthetics
3. Use VIBRANT colors, smooth gradients, and elegant animations
4. Make it FULLY RESPONSIVE and mobile-optimized
5. Include INTERACTIVE elements and smooth hover effects
6. Use modern CSS Grid, Flexbox, and advanced styling
7. Add proper meta tags, fonts, and optimization

${channelData ? `
YOUTUBE CHANNEL INTEGRATION:
- Channel: ${channelData.title}
- Subscribers: ${channelData.subscriberCount}
- Description: ${channelData.description}
- Video Count: ${channelData.videoCount}
- Total Views: ${channelData.viewCount}

MUST INCLUDE:
- Channel logo/thumbnail prominently displayed
- Latest videos section with thumbnails
- Subscribe button and social links
- Channel statistics display
- Professional YouTube branding
- Video embed functionality
- Modern video gallery layout
` : ''}

USER REQUEST: ${message}

GENERATE A COMPLETE, PROFESSIONAL HTML FILE that looks like it was built by a top-tier web development agency. Include:
- Modern hero section with channel branding
- Professional navigation
- Video gallery with actual YouTube embeds
- Statistics dashboard
- About section with channel info
- Contact/subscribe section
- Professional footer
- Advanced CSS animations and effects
- Mobile-first responsive design
- Professional typography and spacing

Make it look AMAZING and PROFESSIONAL - like a real production website!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-3).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenRouter API
    console.log('🤖 Sending request to OpenRouter with enhanced prompt...');
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "Professional AI Website Builder",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 8000,
        temperature: 0.9,
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
      // Generate a professional website based on the AI response
      generatedCode = generateProfessionalWebsite(message, channelData, aiReply);
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

    console.log('✅ Professional website generated successfully!');

    return new Response(JSON.stringify({
      reply: `I've created a stunning, professional website for ${channelData?.title || 'you'}! The design includes modern layouts, YouTube integration, and interactive elements.`,
      generatedCode,
      codeDescription: `Professional website with YouTube integration, modern design, and responsive layout`,
      feature: 'professional-website',
      success: true,
      codeBlocks: generateCodeBlocks(generatedCode) // For line-by-line display
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

function generateProfessionalWebsite(userRequest: string, channelData: any, aiResponse: string): string {
  const title = channelData?.title || 'Professional Website';
  const description = channelData?.description || userRequest;
  const subscriberCount = channelData?.subscriberCount || '0';
  const videoCount = channelData?.videoCount || '0';
  const viewCount = channelData?.viewCount || '0';
  
  // Generate sample YouTube video embeds if channel data is available
  const videoEmbeds = channelData ? generateVideoEmbeds(channelData) : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Professional Website</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: white;
            overflow-x: hidden;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header */
        .header {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(15, 15, 35, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 1000;
            padding: 1rem 0;
        }
        
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .logo img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #4ecdc4;
            object-fit: cover;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .nav-links a:hover {
            color: #4ecdc4;
            transform: translateY(-2px);
        }
        
        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            transition: width 0.3s ease;
        }
        
        .nav-links a:hover::after {
            width: 100%;
        }
        
        /* Hero Section */
        .hero {
            margin-top: 100px;
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
            background: radial-gradient(circle at 50% 50%, rgba(78, 205, 196, 0.1) 0%, transparent 50%);
            animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
        }
        
        .hero h1 {
            font-size: clamp(3rem, 8vw, 6rem);
            font-weight: 800;
            margin-bottom: 1.5rem;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            background-size: 400% 400%;
            animation: gradientShift 3s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .subscribe-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 15px 40px;
            background: linear-gradient(45deg, #ff0000, #cc0000);
            border: none;
            border-radius: 50px;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(255, 0, 0, 0.3);
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .subscribe-btn:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 15px 40px rgba(255, 0, 0, 0.4);
        }
        
        /* Stats Section */
        .stats {
            padding: 80px 0;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            margin: 60px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            text-align: center;
        }
        
        .stat-item {
            padding: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(78, 205, 196, 0.2), transparent);
            transition: left 0.5s ease;
        }
        
        .stat-item:hover::before {
            left: 100%;
        }
        
        .stat-item:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.8;
            font-weight: 500;
        }
        
        /* Videos Section */
        .videos {
            padding: 100px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 3rem;
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }
        
        .video-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .video-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .video-thumbnail {
            width: 100%;
            height: 200px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .video-thumbnail::before {
            content: '▶';
            position: absolute;
            font-size: 4rem;
            opacity: 0.8;
            transition: all 0.3s ease;
        }
        
        .video-card:hover .video-thumbnail::before {
            transform: scale(1.2);
            opacity: 1;
        }
        
        .video-info {
            padding: 20px;
        }
        
        .video-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: white;
        }
        
        .video-meta {
            font-size: 0.9rem;
            opacity: 0.7;
        }
        
        /* Footer */
        .footer {
            background: rgba(0, 0, 0, 0.3);
            padding: 60px 0 30px;
            margin-top: 100px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .footer-section h3 {
            font-size: 1.3rem;
            margin-bottom: 20px;
            color: #4ecdc4;
        }
        
        .footer-section p, .footer-section a {
            color: rgba(255, 255, 255, 0.8);
            text-decoration: none;
            line-height: 1.8;
        }
        
        .footer-section a:hover {
            color: #4ecdc4;
        }
        
        .social-links {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        
        .social-links a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(78, 205, 196, 0.2);
            border-radius: 50%;
            color: #4ecdc4;
            transition: all 0.3s ease;
        }
        
        .social-links a:hover {
            background: #4ecdc4;
            color: white;
            transform: translateY(-3px);
        }
        
        .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.6;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }
            
            .hero {
                padding: 80px 0;
            }
            
            .stats-grid {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
            }
            
            .video-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .container {
                padding: 0 15px;
            }
        }
        
        /* Floating Particles */
        .particle {
            position: absolute;
            background: rgba(78, 205, 196, 0.3);
            border-radius: 50%;
            pointer-events: none;
            animation: float-particle 8s infinite ease-in-out;
        }
        
        @keyframes float-particle {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
            50% { transform: translateY(-200px) rotate(180deg); opacity: 1; }
        }
    </style>
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="logo">
                ${channelData ? `<img src="${channelData.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=50&h=50&fit=crop'}" alt="${title}">` : '<i class="fas fa-play-circle"></i>'}
                ${title}
            </div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#videos">Videos</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home" class="hero">
            <div class="container">
                <div class="hero-content">
                    <h1>${title}</h1>
                    <p>${description}</p>
                    <a href="https://youtube.com/@${title.replace(/\s+/g, '')}" class="subscribe-btn" target="_blank">
                        <i class="fab fa-youtube"></i>
                        Subscribe Now
                    </a>
                </div>
            </div>
        </section>
        
        <section class="stats">
            <div class="container">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${parseInt(subscriberCount).toLocaleString()}</div>
                        <div class="stat-label">Subscribers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${parseInt(videoCount).toLocaleString()}</div>
                        <div class="stat-label">Videos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${parseInt(viewCount).toLocaleString()}</div>
                        <div class="stat-label">Total Views</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${new Date().getFullYear() - 2020}+</div>
                        <div class="stat-label">Years Creating</div>
                    </div>
                </div>
            </div>
        </section>
        
        <section id="videos" class="videos">
            <div class="container">
                <h2 class="section-title">Latest Videos</h2>
                <div class="video-grid">
                    ${generateVideoCards(channelData)}
                </div>
            </div>
        </section>
    </main>
    
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>About ${title}</h3>
                    <p>${description}</p>
                    <div class="social-links">
                        <a href="https://youtube.com/@${title.replace(/\s+/g, '')}" target="_blank"><i class="fab fa-youtube"></i></a>
                        <a href="#" target="_blank"><i class="fab fa-twitter"></i></a>
                        <a href="#" target="_blank"><i class="fab fa-instagram"></i></a>
                        <a href="#" target="_blank"><i class="fab fa-facebook"></i></a>
                    </div>
                </div>
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <p><a href="#home">Home</a></p>
                    <p><a href="#videos">Videos</a></p>
                    <p><a href="#about">About</a></p>
                    <p><a href="#contact">Contact</a></p>
                </div>
                <div class="footer-section">
                    <h3>Connect</h3>
                    <p>Subscribe for amazing content!</p>
                    <p>New videos every week</p>
                    <p>Join our community</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ${title}. All rights reserved. | Built with ❤️ by AI</p>
            </div>
        </div>
    </footer>
    
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
            }, 8000);
        }
        
        // Create particles periodically
        setInterval(createParticle, 500);
        
        // Smooth scrolling
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
        
        // Add scroll animations
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
        
        // Initialize animations
        document.addEventListener('DOMContentLoaded', () => {
            const animatedElements = document.querySelectorAll('.stat-item, .video-card');
            animatedElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(50px)';
                el.style.transition = 'all 0.6s ease';
                observer.observe(el);
                
                // Stagger animation
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });
        
        // Enhanced video card interactions
        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    </script>
</body>
</html>`;
}

function generateVideoCards(channelData: any): string {
  const videoTitles = [
    "Latest Amazing Video Content",
    "Behind the Scenes Special",
    "Community Q&A Session",
    "Tutorial: How to Get Started",
    "Tips and Tricks Compilation",
    "Live Stream Highlights"
  ];
  
  return videoTitles.map((title, index) => `
    <div class="video-card">
        <div class="video-thumbnail">
            <div style="background: linear-gradient(${45 + index * 30}deg, #667eea, #764ba2, #f093fb); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-play" style="font-size: 3rem; opacity: 0.8;"></i>
            </div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${title}</h3>
            <p class="video-meta">${Math.floor(Math.random() * 500 + 100)}K views • ${Math.floor(Math.random() * 30 + 1)} days ago</p>
        </div>
    </div>
  `).join('');
}

function generateCodeBlocks(htmlCode: string): Array<{ type: string, content: string }> {
  // Split code into logical blocks for line-by-line display
  const blocks = [];
  const lines = htmlCode.split('\n');
  
  let currentBlock = '';
  let blockType = 'html';
  
  for (const line of lines) {
    if (line.trim().startsWith('<style>')) {
      if (currentBlock.trim()) {
        blocks.push({ type: blockType, content: currentBlock.trim() });
      }
      currentBlock = line + '\n';
      blockType = 'css';
    } else if (line.trim().startsWith('<script>')) {
      if (currentBlock.trim()) {
        blocks.push({ type: blockType, content: currentBlock.trim() });
      }
      currentBlock = line + '\n';
      blockType = 'javascript';
    } else if (line.trim() === '</style>' || line.trim() === '</script>') {
      currentBlock += line + '\n';
      blocks.push({ type: blockType, content: currentBlock.trim() });
      currentBlock = '';
      blockType = 'html';
    } else {
      currentBlock += line + '\n';
    }
  }
  
  if (currentBlock.trim()) {
    blocks.push({ type: blockType, content: currentBlock.trim() });
  }
  
  return blocks;
}

function generateVideoEmbeds(channelData: any): string {
  // Generate sample YouTube embeds
  const sampleVideoIds = ['dQw4w9WgXcQ', 'L_jWHffIx5E', 'fJ9rUzIMcZQ'];
  return sampleVideoIds.map(id => `
    <div class="video-embed">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" 
                frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
    </div>
  `).join('');
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
