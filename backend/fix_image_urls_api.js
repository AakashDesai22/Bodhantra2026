const fs = require('fs');
const path = require('path');

const files = [
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\pages\\LandingPage.jsx",
    "c:\\Users\\AAKASH\\Desktop\\Team-Mavericks-Web-main\\frontend\\src\\features\\participant\\RegistrationPage.jsx"
];

let changedCount = 0;

for (const fp of files) {
    if (!fs.existsSync(fp)) continue;
    
    let content = fs.readFileSync(fp, 'utf8');
    
    // Regex to match: `${API}${variable}` and replace with inline check
    const regex = /\$\{API\}\$\{([^}]+(?:url|picture)[^}]*)\}/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, (match, p1) => {
            return `\${${p1}?.startsWith('http') ? ${p1} : \`\${API}\${${p1}}\`}`;
        });
        fs.writeFileSync(fp, content, 'utf8');
        changedCount++;
        console.log("Updated:", path.basename(fp));
    }
}

console.log(`Total files updated: ${changedCount}`);
