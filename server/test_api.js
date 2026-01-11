const aliexpress = require('./services/aliexpress');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    try {
        const products = await aliexpress.getHotProducts();
        console.log('Full Response:', JSON.stringify(products, null, 2));
        if (products.error_response) {
            console.log('Error Code:', products.error_response.code);
            console.log('Error Msg:', products.error_response.msg);
            console.log('Error Sub Code:', products.error_response.sub_code);
        }
        const productList = products?.aliexpress_affiliate_hotproduct_query_response?.resp_result?.result?.products?.product;
        if (productList && productList.length > 0) {
            console.log('First Product Keys:', Object.keys(productList[0]));
            console.log('Product Data:', JSON.stringify(productList[0], null, 2));
        } else {
            console.log('No products found.');
        }
    } catch (err) {
        console.error(err);
    }
}

test();
