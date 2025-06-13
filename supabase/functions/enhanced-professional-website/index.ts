
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AI providers with fallback chain
const AI_PROVIDERS = [
  { name: 'together', key: 'TOGETHER_API_KEY', url: 'https://api.together.xyz/v1/chat/completions', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
  { name: 'groq', key: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-70b-versatile' },
  { name: 'openrouter', key: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.1-70b-instruct' }
];

async function getActiveApiKey(provider: string) {
  try {
    const { data, error } = await supabase
      .from(`${provider}_api_keys`)
      .select('api_key')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return data.api_key;
  } catch (error) {
    console.error(`Error getting ${provider} API key:`, error);
    return null;
  }
}

async function callAI(prompt: string, channelData: any, userRequest: string) {
  let lastError = null;

  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`🤖 Trying ${provider.name} AI...`);
      
      const apiKey = await getActiveApiKey(provider.name);
      if (!apiKey) {
        console.log(`❌ No active API key for ${provider.name}`);
        continue;
      }

      const systemPrompt = `You are a professional website builder AI that creates modern, responsive websites for YouTube channels.

CRITICAL INSTRUCTIONS:
1. Create a COMPLETE, professional website with multiple pages
2. Use modern CSS Grid and Flexbox for layouts
3. Implement responsive design for all screen sizes
4. Include professional typography and color schemes
5. Add smooth animations and transitions
6. Integrate real YouTube content (videos, channel info)
7. Make it SEO optimized and performance focused

Channel Data: ${JSON.stringify(channelData)}
User Request: ${userRequest}

Create a professional, modern website that represents this YouTube channel perfectly.`;

      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(provider.name === 'openrouter' && { 'HTTP-Referer': 'https://your-site.com' })
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`${provider.name} API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        console.log(`✅ ${provider.name} AI successful`);
        
        // Update API usage
        await supabase
          .from(`${provider.name}_api_keys`)
          .update({ 
            requests_count: supabase.sql`requests_count + 1`,
            last_used_at: new Date().toISOString()
          })
          .eq('api_key', apiKey);

        return {
          content: data.choices[0].message.content,
          provider: provider.name
        };
      }
    } catch (error) {
      console.error(`❌ ${provider.name} failed:`, error);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

function generateProfessionalWebsite(channelData: any, userRequest: string = ''): string {
  const channelTitle = channelData?.title || 'YouTube Channel';
  const channelDescription = channelData?.description || 'Welcome to our YouTube channel';
  const subscriberCount = channelData?.subscriberCount || '0';
  const videos = channelData?.videos || [];
  const thumbnail = channelData?.thumbnail || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelTitle} - Official Website</title>
    <meta name="description" content="${channelDescription}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            overflow-x: hidden;
        }

        /* Header */
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }

        .nav {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 1.5rem;
            font-weight: bold;
            color: #764ba2;
        }

        .logo img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: #333;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .nav-links a:hover {
            color: #764ba2;
        }

        /* Hero Section */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .hero-content {
            max-width: 800px;
            padding: 2rem;
            animation: fadeInUp 1s ease;
        }

        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin: 2rem 0;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            display: block;
        }

        .stat-label {
            font-size: 1rem;
            opacity: 0.8;
        }

        .cta-button {
            display: inline-block;
            background: #ff4757;
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 71, 87, 0.6);
        }

        /* Videos Section */
        .videos-section {
            padding: 5rem 0;
            background: white;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #333;
        }

        .videos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }

        .video-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .video-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .video-thumbnail {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .video-info {
            padding: 1.5rem;
        }

        .video-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #333;
        }

        .video-description {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .video-meta {
            margin-top: 1rem;
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #888;
        }

        /* About Section */
        .about-section {
            padding: 5rem 0;
            background: #f8f9fa;
        }

        .about-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            align-items: center;
        }

        .about-text {
            font-size: 1.1rem;
            line-height: 1.8;
            color: #555;
        }

        .about-image {
            text-align: center;
        }

        .about-image img {
            width: 300px;
            height: 300px;
            border-radius: 50%;
            object-fit: cover;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        /* Footer */
        .footer {
            background: #333;
            color: white;
            padding: 3rem 0;
            text-align: center;
        }

        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-section h3 {
            margin-bottom: 1rem;
            color: #764ba2;
        }

        .footer-section p, .footer-section a {
            color: #ccc;
            text-decoration: none;
            line-height: 1.6;
        }

        .footer-section a:hover {
            color: white;
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

        /* Responsive Design */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }

            .stats {
                flex-direction: column;
                gap: 1rem;
            }

            .about-content {
                grid-template-columns: 1fr;
                text-align: center;
            }

            .nav-links {
                display: none;
            }

            .videos-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="nav">
            <div class="logo">
                ${thumbnail ? `<img src="${thumbnail}" alt="${channelTitle}">` : ''}
                <span>${channelTitle}</span>
            </div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#videos">Videos</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Welcome to ${channelTitle}</h1>
            <p>${channelDescription}</p>
            
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">${parseInt(subscriberCount).toLocaleString()}</span>
                    <span class="stat-label">Subscribers</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${videos.length}</span>
                    <span class="stat-label">Videos</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${channelData?.viewCount ? parseInt(channelData.viewCount).toLocaleString() : 'N/A'}</span>
                    <span class="stat-label">Total Views</span>
                </div>
            </div>

            <a href="#videos" class="cta-button">Watch Our Videos</a>
        </div>
    </section>

    <!-- Videos Section -->
    <section id="videos" class="videos-section">
        <div class="container">
            <h2 class="section-title">Latest Videos</h2>
            <div class="videos-grid">
                ${videos.slice(0, 6).map(video => `
                    <div class="video-card">
                        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                        <div class="video-info">
                            <h3 class="video-title">${video.title}</h3>
                            <p class="video-description">${video.description?.substring(0, 100) || 'Watch this amazing video!'}...</p>
                            <div class="video-meta">
                                <span>${video.viewCount ? parseInt(video.viewCount).toLocaleString() : '0'} views</span>
                                <span>${new Date(video.publishedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about-section">
        <div class="container">
            <h2 class="section-title">About Our Channel</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>${channelDescription}</p>
                    <p>Join our community of ${parseInt(subscriberCount).toLocaleString()} subscribers and discover amazing content that will educate, entertain, and inspire you.</p>
                </div>
                <div class="about-image">
                    ${thumbnail ? `<img src="${thumbnail}" alt="${channelTitle}">` : '<div style="width: 300px; height: 300px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">Channel Logo</div>'}
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="contact" class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Contact</h3>
                    <p>Get in touch with us for collaborations and inquiries.</p>
                </div>
                <div class="footer-section">
                    <h3>Social Media</h3>
                    <p><a href="${channelData?.customUrl ? `https://youtube.com/${channelData.customUrl}` : '#'}">YouTube Channel</a></p>
                </div>
                <div class="footer-section">
                    <h3>Subscribe</h3>
                    <p>Don't miss out on our latest content!</p>
                </div>
            </div>
            <p>&copy; 2024 ${channelTitle}. All rights reserved.</p>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Add scroll effect to header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
    </script>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userRequest, channelData, projectContext, currentCode } = await req.json();

    console.log('🚀 Enhanced Professional Website Generation Started');
    console.log('User Request:', userRequest);
    console.log('Channel:', channelData?.title);

    let generatedCode = '';
    let codeDescription = '';
    let reply = '';

    if (userRequest && userRequest.trim()) {
      // Try AI modification first
      try {
        const prompt = `Modify the existing website code based on this request: "${userRequest}"

Current code:
${currentCode || 'No existing code'}

Channel data: ${JSON.stringify(channelData)}

INSTRUCTIONS:
1. Make ONLY the specific changes requested
2. Preserve ALL existing styling and functionality
3. Maintain responsive design
4. Keep professional appearance
5. Return ONLY the complete HTML code

Make the requested modification while keeping everything else exactly the same.`;

        const aiResult = await callAI(prompt, channelData, userRequest);
        
        if (aiResult.content) {
          generatedCode = aiResult.content;
          codeDescription = `Modified with ${aiResult.provider} AI: ${userRequest}`;
          reply = `✅ I've successfully modified your website using ${aiResult.provider} AI. The changes have been applied while preserving your existing design and functionality.`;
        }
      } catch (aiError) {
        console.log('🔄 AI modification failed, generating new professional website');
        generatedCode = generateProfessionalWebsite(channelData, userRequest);
        codeDescription = 'Generated new professional website (AI fallback)';
        reply = '✅ I\'ve created a professional website for your YouTube channel with modern design and responsive layout.';
      }
    } else {
      // Generate new professional website
      console.log('🎨 Generating new professional website');
      generatedCode = generateProfessionalWebsite(channelData, userRequest);
      codeDescription = 'Generated professional website';
      reply = '🎉 I\'ve created a stunning, professional website for your YouTube channel with modern design, responsive layout, and integrated channel content!';
    }

    return new Response(JSON.stringify({
      generatedCode,
      codeDescription,
      reply,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in enhanced-professional-website:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
