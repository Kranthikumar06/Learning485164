const fs = require('fs');
const path = require('path');

function saveComplaint(complaint) {
	const filePath = path.join(__dirname, '../../data/complaints.json');
	let complaints = [];
	if (fs.existsSync(filePath)) {
		try {
			complaints = JSON.parse(fs.readFileSync(filePath));
		} catch (e) {
			complaints = [];
		}
	}
	complaints.push(complaint);
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(complaints, null, 2));
}

module.exports = { saveComplaint };
