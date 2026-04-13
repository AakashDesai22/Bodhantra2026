const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
    try {
        // Create a dummy image file
        fs.writeFileSync('dummy.jpg', 'fake image data');

        const form = new FormData();
        form.append('image', fs.createReadStream('dummy.jpg'));

        console.log("Sending POST to /api/upload");
        const res = await axios.post('http://localhost:5000/api/upload', form, {
            headers: form.getHeaders()
        });

        console.log("Success:", res.data);
    } catch (err) {
        if (err.response) {
            console.error("HTTP Error:", err.response.status, err.response.data);
        } else {
            console.error("Axios Error:", err.message);
        }
    } finally {
        if (fs.existsSync('dummy.jpg')) fs.unlinkSync('dummy.jpg');
    }
}

testUpload();
