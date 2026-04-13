const axios = require('axios');
const FormData = require('form-data');

async function run() {
    const validPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const buf = Buffer.from(validPngBase64, 'base64');
    
    const form = new FormData();
    form.append('file', buf, 'test.png');
    form.append('upload_preset', 'bodhantra'); // using unsigned preset
    
    try {
        const url = `https://api.cloudinary.com/v1_1/djvnjnby1/image/upload`;
        const res = await axios.post(url, form, {
            headers: form.getHeaders()
        });
        console.log("REST SUCCESS:", res.data.secure_url);
    } catch (e) {
        console.log("REST ERROR:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
    }
}
run();
