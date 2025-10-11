 const chatBox = document.getElementById("chatBox");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    sendBtn.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    function sendMessage() {
      const msg = userInput.value.trim();
      if (msg === "") return;

      const userMsg = document.createElement("div");
      userMsg.classList.add("message", "user");
      userMsg.textContent = msg;
      chatBox.appendChild(userMsg);
      chatBox.scrollTop = chatBox.scrollHeight;

      userInput.value = "";

      setTimeout(() => {
        const botMsg = document.createElement("div");
        botMsg.classList.add("message", "bot");
        botMsg.textContent = getBotReply(msg);
        chatBox.appendChild(botMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 700);
    }

    function getBotReply(input) {
      const text = input.toLowerCase();
      if (text.includes("hi") || text.includes("hello")) return "Hello 👋! How can I help you today?";
      if (text.includes("complaint")) return "You can file your complaint in the Complaint Box section.";
      if (text.includes("help")) return "Sure! Please describe your issue, or visit the Help Center.";
      if (text.includes("bye")) return "Goodbye! Stay safe and take care 🌸";
      return "I'm not sure about that 🤔 but I’ll do my best to assist!";
    }