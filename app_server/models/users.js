const fs = require('fs');
const path = require('path');

function saveComplaint(complaint) {
    const filePath = path.join(__dirname, '../../data/users.json');
    let users = [];
    if (fs.existsSync(filePath)) {
        try {
            users = JSON.parse(fs.readFileSync(filePath));
        } catch (e) {
            users = [];
        }
    }
    users.push(complaint);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
}

module.exports = { saveUser };