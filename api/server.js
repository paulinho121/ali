const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log incoming requests for debugging Vercel routing
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

const aliexpress = require('../server/services/aliexpress');
const trends = require('../server/services/trends');
const social = require('../server/services/social');
const video = require('../server/services/video');

// Shared logic for getting redirect URI
function getRedirectBase(req) {
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    let redirectBase = process.env.TIKTOK_REDIRECT_BASE_URL;
    if (!redirectBase || redirectBase.includes('loca.lt')) {
        redirectBase = `${protocol}://${host}`;
    }
    return redirectBase;
}

// Routes
app.get(['/api/health', '/api/server/health'], (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get(['/api/auth/debug', '/api/server/debug'], (req, res) => {
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const redirectBase = getRedirectBase(req);
    const redirectUri = `${redirectBase}/api/auth/tiktok/callback`;

    res.json({
        host,
        protocol,
        TIKTOK_REDIRECT_BASE_URL_ENV: process.env.TIKTOK_REDIRECT_BASE_URL || "NOT SET",
        expected_redirect_uri: redirectUri,
        actual_url_seen_by_express: req.url
    });
});

let currentCodeVerifier = "";

app.get(['/api/auth/tiktok', '/api/server/auth/tiktok'], (req, res) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const redirectBase = getRedirectBase(req);
    const redirectUri = encodeURIComponent(`${redirectBase}/api/auth/tiktok/callback`);

    currentCodeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256')
        .update(currentCodeVerifier)
        .digest('base64url')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    const scope = 'video.upload,video.publish';
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&lang=en&redirect_uri=${redirectUri}&response_type=code&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    res.redirect(authUrl);
});

app.get(['/api/auth/tiktok/callback', '/api/server/auth/tiktok/callback'], async (req, res) => {
    const { code } = req.query;
    const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET?.trim();
    const redirectBase = getRedirectBase(req);

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
            new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: `${redirectBase}/api/auth/tiktok/callback`,
                code_verifier: currentCodeVerifier
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        res.json({
            success: true,
            message: "Token obtido com sucesso!",
            data: response.data
        });
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Centralized automation handler to support both direct and rewritten paths
const handleAutomationRequest = async (req, res) => {
    const cronSecret = req.headers['x-vercel-cron'];
    const isManual = req.method === 'POST';

    if (process.env.NODE_ENV === 'production' && !cronSecret && !isManual) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await runAutomation();
        res.json({ status: 'success', result });
    } catch (error) {
        console.error('Automation error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

app.all('/api/automation/run', handleAutomationRequest);
app.all('/api/server', (req, res) => {
    // If Vercel rewrote /api/automation/run to /api/server, handle it here
    handleAutomationRequest(req, res);
});

async function runAutomation() {
    console.log('--- Iniciando Automação Diária ---');
    const trend = await trends.getDailyTrends();
    console.log('Tendência do dia:', trend.niche);

    let productList = [];

    // Try searching by keywords
    try {
        const searchRes = await aliexpress.searchByKeywords(trend.niche);
        productList = searchRes?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];
        console.log(`Encontrados ${productList.length} produtos por palavras-chave.`);
    } catch (e) {
        console.error('Erro na busca por palavras-chave:', e.message);
    }

    // Fallback: If no products found, try Hot Products
    if (!productList || productList.length === 0) {
        console.log('Fallback: Buscando produtos quentes...');
        const hotRes = await aliexpress.getHotProducts();
        productList = hotRes?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product || [];
        console.log(`Encontrados ${productList.length} produtos quentes.`);
    }

    if (!productList || productList.length === 0) throw new Error('Nenhum produto encontrado no AliExpress.');

    const topProduct = productList[0];
    const affiliateRes = await aliexpress.generateAffiliateLinks(topProduct.product_detail_url);
    const affiliateLink = affiliateRes?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link || topProduct.short_url;

    const videoResult = await video.generateProductVideo(topProduct);
    if (!videoResult.success) throw new Error(`Video generation failed: ${videoResult.error}`);

    const finalVideoUrl = await video.waitForRender(videoResult.renderId);
    const caption = `Oferta do dia: ${topProduct.product_main_title} 🔥\n\nConfira aqui: ${affiliateLink}\n\n#aliexpress #achadinhos #promocao`;

    const tiktokResult = await social.postToTikTok(finalVideoUrl, caption);
    const igResult = await social.postToInstagram(finalVideoUrl, caption);

    return {
        product: topProduct.product_main_title,
        videoUrl: finalVideoUrl,
        social: { tiktok: tiktokResult.success, ig: igResult.success }
    };
}

module.exports = app;
