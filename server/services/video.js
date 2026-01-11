const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const API_KEY = process.env.SHOTSTACK_API_KEY;
const API_URL = 'https://api.shotstack.io/v1/render';

async function generateProductVideo(product) {
    if (!API_KEY) {
        console.warn('Shotstack API Key missing. Skipping video generation.');
        return { success: false, url: null };
    }

    console.log(`Generating video for: ${product.product_main_title}`);

    const images = (product.product_small_image_urls?.string) || [product.product_main_image_url].filter(Boolean);
    console.log(`Images found: ${images.length}`);

    // Create a simple slideshow edit
    const clips = images.slice(0, 5).map((url, index) => ({
        asset: {
            type: 'image',
            src: url
        },
        start: index * 3,
        length: 3,
        effect: 'zoomIn'
    }));

    // Add a title overlay
    clips.push({
        asset: {
            type: 'html',
            html: `<p style="color: #ffffff; font-size: 40px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 20px;">${product.target_sale_price} USD</p>`,
            css: 'p { font-family: "Montserrat", sans-serif; text-align: center; }',
            width: 600,
            height: 200
        },
        start: 0,
        length: 15,
        position: 'center'
    });

    const timeline = {
        tracks: [{ clips }]
    };

    const output = {
        format: 'mp4',
        resolution: 'hd'
    };

    try {
        const response = await axios.post(API_URL, { timeline, output }, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Shotstack Render Started:', response.data.response.id);
        return { success: true, renderId: response.data.response.id };
    } catch (error) {
        console.error('Shotstack API Error:', error.response ? error.response.data : error.message);
        return { success: false, error: error.message };
    }
}

async function getRenderStatus(renderId) {
    try {
        const response = await axios.get(`${API_URL}/${renderId}`, {
            headers: { 'x-api-key': API_KEY }
        });
        return response.data.response;
    } catch (error) {
        console.error('Error checking render status:', error.message);
        throw error;
    }
}

async function waitForRender(renderId, retryCount = 0) {
    if (retryCount > 20) { // Max 20 retries (approx 100 seconds)
        throw new Error('Video rendering timed out');
    }

    console.log(`Checking render status for ${renderId} (Attempt ${retryCount + 1})...`);
    const status = await getRenderStatus(renderId);

    if (status.status === 'done') {
        console.log('Video rendering completed:', status.url);
        return status.url;
    }

    if (status.status === 'failed') {
        throw new Error(`Video rendering failed: ${status.error}`);
    }

    // Wait 5 seconds and try again
    await sleep(5000);
    return waitForRender(renderId, retryCount + 1);
}

module.exports = {
    generateProductVideo,
    getRenderStatus,
    waitForRender
};
