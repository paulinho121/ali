const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function postToTikTok(videoUrl, title) {
    const token = process.env.TIKTOK_ACCESS_TOKEN;
    if (!token) {
        console.warn('TikTok token missing. Skipping post.');
        return { success: false, reason: 'No token' };
    }

    console.log(`Uploading video to TikTok: ${title}`);

    try {
        const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            post_info: {
                title: title.substring(0, 150), // TikTok title limit
                privacy_level: 'PUBLIC_TO_EVERYONE'
            },
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoUrl
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('TikTok Post Initiated:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('TikTok Post Error:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

async function postToInstagram(videoUrl, caption) {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!token || !businessId) {
        console.warn('Instagram credentials missing. Skipping post.');
        return { success: false, reason: 'No credentials' };
    }

    console.log(`Uploading video to Instagram: ${caption}`);

    try {
        // 1. Create Media Container
        const containerRes = await axios.post(`https://graph.facebook.com/v18.0/${businessId}/media`, null, {
            params: {
                media_type: 'REELS',
                video_url: videoUrl,
                caption: caption,
                access_token: token
            }
        });

        const containerId = containerRes.data.id;
        console.log('Instagram Container Created:', containerId);

        // 2. Poll for Status (Simplified for now - wait 30s)
        console.log('Waiting for Instagram processing...');
        await sleep(30000);

        // 3. Publish Media
        const publishRes = await axios.post(`https://graph.facebook.com/v18.0/${businessId}/media_publish`, null, {
            params: {
                creation_id: containerId,
                access_token: token
            }
        });

        console.log('Instagram Post Published:', publishRes.data.id);
        return { success: true, id: publishRes.data.id };
    } catch (error) {
        console.error('Instagram Post Error:', error.response ? error.response.data : error.message);
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

module.exports = {
    postToTikTok,
    postToInstagram
};
