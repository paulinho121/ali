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
    const sysParams = {
        app_key: APP_KEY,
        format: 'json',
        method: 'aliexpress.affiliate.hotproduct.query',
        sign_method: 'md5',
        timestamp: timestamp,
        v: '2.0'
    };

    const bizParams = {
        tracking_id: TRACK_ID,
        page_size: '20'
    };

    const allParams = { ...sysParams, ...bizParams };
    const sortedKeys = Object.keys(allParams).sort();
    let signStr = APP_SECRET;
    for (const key of sortedKeys) {
        signStr += key + allParams[key];
    }
    signStr += APP_SECRET;

    const sign = CryptoJS.MD5(signStr).toString(CryptoJS.enc.Hex).toUpperCase();

    const query = Object.keys(sysParams).sort().map(k => `${k}=${encodeURIComponent(sysParams[k])}`).join('&');
    const url = `${API_URL}?${query}&sign=${sign}`;

    const body = new URLSearchParams(bizParams).toString();

    try {
        const response = await axios.post(url, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
