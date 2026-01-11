const axios = require('axios');
const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACK_ID = process.env.ALIEXPRESS_TRACKING_ID;
const API_URL = 'https://api-sg.aliexpress.com/sync';

async function test() {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const params = {
        app_key: APP_KEY,
        format: 'json',
        method: 'aliexpress.affiliate.hotproduct.query',
        sign_method: 'md5',
        timestamp: timestamp,
        tracking_id: TRACK_ID,
        v: '2.0',
        page_size: '20'
    };

    const sortedKeys = Object.keys(params).sort();
    let signStr = APP_SECRET;
    for (const key of sortedKeys) {
        signStr += key + params[key];
    }
    signStr += APP_SECRET;

    const sign = CryptoJS.MD5(signStr).toString(CryptoJS.enc.Hex).toUpperCase();

    const query = Object.keys(params).sort().map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
    const url = `${API_URL}?${query}&sign=${sign}`;

    console.log('Testing URL:', url);

    try {
        const response = await axios.get(url);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
