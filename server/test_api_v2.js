const axios = require('axios');
const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACK_ID = process.env.ALIEXPRESS_TRACKING_ID;
const API_URL = 'https://api-sg.aliexpress.com/sync';

function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let basestring = secret;
    for (const key of sortedKeys) {
        basestring += key + params[key];
    }
    basestring += secret;
    return CryptoJS.MD5(basestring).toString(CryptoJS.enc.Hex).toUpperCase();
}

async function test() {
    const params = {
        method: 'aliexpress.affiliate.hotproduct.query',
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        tracking_id: TRACK_ID,
        page_size: '20'
    };

    params.sign = signRequest(params, APP_SECRET);

    try {
        const response = await axios.get(API_URL, { params });
        console.log('Full Response Structure:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
