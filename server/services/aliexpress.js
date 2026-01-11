const axios = require('axios');
const CryptoJS = require('crypto-js');

const APP_KEY = process.env.ALIEXPRESS_APP_KEY;
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET;
const TRACK_ID = process.env.ALIEXPRESS_TRACKING_ID;
const API_URL = 'https://api-sg.aliexpress.com/sync';

function signRequest(params, secret) {
    const sortedKeys = Object.keys(params).sort();
    let basestring = secret;
    for (const key of sortedKeys) {
        if (key === 'sign') continue;
        basestring += key + String(params[key]);
    }
    basestring += secret;
    return CryptoJS.MD5(basestring).toString(CryptoJS.enc.Hex).toUpperCase();
}

async function searchByKeywords(keywords) {
    const params = {
        method: 'aliexpress.affiliate.product.query',
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        tracking_id: TRACK_ID,
        keywords: keywords,
        page_size: '20'
    };

    params.sign = signRequest(params, APP_SECRET);

    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('AliExpress Search Error:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getHotProducts() {
    const params = {
        method: 'aliexpress.affiliate.hotproduct.query',
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        tracking_id: TRACK_ID,
        page_size: '20'
    };

    params.sign = signRequest(params, APP_SECRET);

    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('AliExpress Hot Products Error:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function generateAffiliateLinks(sourceUrls) {
    const params = {
        method: 'aliexpress.affiliate.link.generate',
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        tracking_id: TRACK_ID,
        promotion_link_type: '0',
        source_values: sourceUrls,
        ship_to_country: 'BR'
    };

    params.sign = signRequest(params, APP_SECRET);

    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('AliExpress Link Generate Error:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getProductDetails(productIds) {
    const params = {
        method: 'aliexpress.affiliate.productdetail.get',
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        format: 'json',
        v: '2.0',
        sign_method: 'md5',
        tracking_id: TRACK_ID,
        product_ids: productIds,
        target_currency: 'USD',
        target_language: 'EN',
        country: 'BR'
    };

    params.sign = signRequest(params, APP_SECRET);

    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error('AliExpress Product Details Error:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    getHotProducts,
    searchByKeywords,
    generateAffiliateLinks,
    getProductDetails
};
