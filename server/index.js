const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const aliexpress = require('./services/aliexpress');
const trends = require('./services/trends');
const social = require('./services/social');
const video = require('./services/video');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

let currentCodeVerifier = '';

// TikTok OAuth Routes
app.get('/api/auth/tiktok', (req, res) => {
    const redirectBase = process.env.TIKTOK_REDIRECT_BASE_URL || 'http://localhost:5000';
    const redirectUri = encodeURIComponent(`${redirectBase}/api/auth/tiktok/callback`);

    // Generate PKCE (Base64URL is standard for v2)
    currentCodeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256')
        .update(currentCodeVerifier)
        .digest('base64url')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const scope = 'user.info.basic,video.upload,video.publish';
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&lang=en&redirect_uri=${redirectUri}&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    console.log('--- TikTok Auth Initiation ---');
    console.log(`Client Key: ${clientKey}`);
    console.log(`Redirect URI: ${decodeURIComponent(redirectUri)}`);
    console.log(`Constructed URL: ${authUrl}`);

    res.redirect(authUrl);
});

app.get('/api/auth/tiktok/callback', async (req, res) => {
    const { code, state } = req.query;
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
            new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.TIKTOK_REDIRECT_BASE_URL || 'http://localhost:5000'}/api/auth/tiktok/callback`,
                code_verifier: currentCodeVerifier
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache'
                }
            }
        );

        res.json({
            message: 'TikTok Authorization Successful',
            data: response.data
        });
    } catch (error) {
        console.error('TikTok Auth Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to exchange code for token', details: error.response ? error.response.data : error.message });
    }
});

// Main Automation Logic
async function runAutomation() {
    console.log('--- Starting Daily Automation Cycle ---');
    try {
        // 1. Identify Trend
        const trend = await trends.getDailyTrends();
        console.log(`Trend identified: ${trend.niche}`);

        // 2. Search Products from AliExpress based on trend
        let products = await aliexpress.searchByKeywords(trend.niche);
        let productList = products?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;

        if (!productList || productList.length === 0) {
            console.log('No specific trend products found, falling back to hot products...');
            products = await aliexpress.getHotProducts();
            productList = products?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product;
        }

        console.log(`Found ${productList?.length || 0} products.`);

        // 3. Selection
        const topProduct = productList?.[0];

        if (topProduct) {
            // Normalize product fields
            topProduct.product_main_title = topProduct.product_main_title || topProduct.product_title;
            topProduct.target_sale_price = topProduct.target_sale_price || topProduct.sale_price || topProduct.original_price;
            topProduct.product_main_image_url = topProduct.product_main_image_url || (topProduct.product_small_image_urls?.string?.[0]);

            console.log(`Selected Product: ${topProduct.product_main_title}`);

            // 2.1 Get Affiliate Link
            console.log('Generating affiliate link...');
            const productUrl = topProduct.promotion_link || topProduct.product_detail_url;
            let affiliateLink = productUrl;
            try {
                const linkRes = await aliexpress.generateAffiliateLinks(productUrl);
                const generatedLinks = linkRes?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link;
                if (generatedLinks && generatedLinks.length > 0) {
                    affiliateLink = generatedLinks[0].promotion_link;
                    console.log(`Affiliate Link Generated: ${affiliateLink}`);
                }
            } catch (linkErr) {
                console.warn('Failed to generate affiliate link, using original link:', linkErr.message);
            }

            // 3.1 Geração de Vídeo
            console.log('Iniciando geração de vídeo no Shotstack...');
            const videoResult = await video.generateProductVideo(topProduct);

            if (!videoResult.success) {
                throw new Error(`Video generation failed: ${videoResult.error}`);
            }

            // 3.2 Wait for Video to finish rendering
            console.log(`Waiting for video render ${videoResult.renderId}...`);
            const finalVideoUrl = await video.waitForRender(videoResult.renderId);

            // 4. Posting
            const caption = `Oferta do dia: ${topProduct.product_main_title} 🔥\n\nConfira aqui: ${affiliateLink}\n\n#aliexpress #achadinhos #promocao`;

            console.log('Posting to TikTok...');
            const tiktokResult = await social.postToTikTok(finalVideoUrl, caption);

            console.log('Posting to Instagram...');
            const igResult = await social.postToInstagram(finalVideoUrl, caption);

            return {
                success: true,
                product: topProduct.product_main_title,
                price: topProduct.target_sale_price,
                affiliateLink: affiliateLink,
                video: 'Completed',
                videoUrl: finalVideoUrl,
                social: { tiktok: tiktokResult.success, ig: igResult.success }
            };
        } else {
            throw new Error('No products found on AliExpress for the current trend.');
        }
    } catch (error) {
        console.error('Automation failed:', error.message);
        throw error;
    }
}

// Automation Endpoint (Manual Trigger)
app.post('/api/automation/run', async (req, res) => {
    try {
        const result = await runAutomation();
        res.json({ message: 'Automation executed successfully', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Daily Cron Job (at 09:00 AM)
cron.schedule('0 9 * * *', async () => {
    console.log('Starting scheduled automation...');
    try {
        await runAutomation();
    } catch (e) {
        console.error('Scheduled task failed.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
