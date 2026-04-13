const fs = require('fs');
const path = require('path');

const files = [
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\profile\\ProfilePage.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\certificates\\CertificateMapper.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\winner\\WinnerThemeHub.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\winner\\VaultVideoReveal.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\winner\\TechnicalReveal.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\winner\\JackpotReveal.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\users\\UserManagement.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\registrations\\ParticipantDetailModal.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\events\\EventManager.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\allocation\\reveal-games\\jackpot\\WinnerConfigurator.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\admin\\allocation\\reveal-games\\jackpot\\JackpotDisplay.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\components\\Navbar.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\pages\\LandingPage.jsx" // Just in case
];

let changedCount = 0;

for (const fp of files) {
    if (!fs.existsSync(fp)) continue;
    
    let content = fs.readFileSync(fp, 'utf8');
    
    // Regex to match: `${API_URL}${variable}` and replace with:
    // ${variable?.startsWith('http') ? variable : `${API_URL}${variable}`}
    const regex = /\$\{API_URL\}\$\{([^}]+)\}/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, (match, p1) => {
            return `\${${p1}?.startsWith('http') ? ${p1} : \`\${API_URL}\${${p1}}\`}`;
        });
        fs.writeFileSync(fp, content, 'utf8');
        changedCount++;
        console.log("Updated:", path.basename(fp));
    }
}

console.log(`Total files updated: ${changedCount}`);
