require('dotenv').config();
const { Registration, User } = require('../models');
const QRCode = require('qrcode');

async function main() {
    try {
        const alice = await User.findOne({ where: { name: 'Alice Tester' } });
        if (!alice) {
            console.log('Alice not found!');
            return process.exit(1);
        }
        
        const regs = await Registration.findAll({ where: { user_id: alice.id } });
        if (regs.length > 0) {
            // regs[0] = legacy, regs[1] = modern
            await QRCode.toFile('alice_legacy_qr.png', regs[0].qr_token, { width: 300 });
            await QRCode.toFile('alice_modern_qr.png', regs[1].qr_token, { width: 300 });
            console.log('Saved Alice QR codes to alice_legacy_qr.png and alice_modern_qr.png');
        } else {
            console.log('Registrations not found');
        }
    } catch (e) {
        console.error(e);
    }
}
main();
