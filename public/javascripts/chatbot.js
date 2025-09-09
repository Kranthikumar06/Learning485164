// Chatbot JS for help page
let history = [];
function appendMessage(sender, text, id) {
    const conversation = document.getElementById('conversation');
    if (!conversation) return;
    const msgDiv = document.createElement('div');
    msgDiv.style.margin = '10px 0';
    msgDiv.className = sender === 'You' ? 'user-msg' : 'bot-msg';
    msgDiv.innerHTML = `<b>${sender}:</b> <span id="${id||''}">${text}</span>`;
    conversation.appendChild(msgDiv);
    conversation.scrollTop = conversation.scrollHeight;
}
function sendToPython() {
    const inputBox = document.getElementById('inputBox');
    const value = inputBox.value.trim();
    if (!value) return;
    appendMessage('You', value);
    history.push({ role: 'user', content: value });
    inputBox.value = '';
    // Add bot loading message
    const botMsgId = 'botmsg-' + Date.now();
    appendMessage('Bot', '<span class="loader"></span>', botMsgId);
    fetch('http://localhost:10000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history })
    })
    .then(response => response.json())
    .then(data => {
        const botMsg = document.getElementById(botMsgId);
        if (botMsg) botMsg.innerText = data.response;
        history.push({ role: 'bot', content: data.response });
    })
    .catch(error => {
        const botMsg = document.getElementById(botMsgId);
        if (botMsg) botMsg.innerText = 'Error: ' + error;
    });
}
