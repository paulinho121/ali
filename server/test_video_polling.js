const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const video = require('./services/video');
const aliexpress = require('./services/aliexpress');

async function testVideoFlow() {
    console.log('--- Fetching real product from AliExpress ---');
    const productsRes = await aliexpress.searchByKeywords('kitchen gadget');
    console.log('AliExpress Raw Response:', JSON.stringify(productsRes, null, 2));
    const productList = productsRes?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;

    if (!productList || productList.length === 0) {
        console.error('No products found');
        return;
    }

    const mockProduct = productList[0];
    // Normalize fields
    mockProduct.product_main_title = mockProduct.product_main_title || mockProduct.product_title;
    mockProduct.target_sale_price = mockProduct.target_sale_price || mockProduct.sale_price;
    mockProduct.product_main_image_url = mockProduct.product_main_image_url || mockProduct.product_small_image_urls?.string?.[0];

    console.log('Testing with product:', mockProduct.product_main_title);

    console.log('--- Testing Video Generation ---');
    try {
        const genRes = await video.generateProductVideo(mockProduct);
        if (genRes.success) {
            console.log('ID:', genRes.renderId);
            try {
                const url = await video.waitForRender(genRes.renderId);
                console.log('URL:', url);
            } catch (err) {
                const status = await video.getRenderStatus(genRes.renderId);
                console.log('ERROR:', status.error || status.status);
            }
        }
    } catch (err) {
        console.error('CRITICAL:', err.message);
    }
}

testVideoFlow();
