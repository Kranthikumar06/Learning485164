import os
import time
from flask import Flask, request, jsonify, send_from_directory
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
genai.configure(api_key="AIzaSyAdc8noP6fnJy1R6iZSw0uGxcmp5ZUP3LY")

def chat_with_gemini(history, retries=3):
    model = genai.GenerativeModel("gemini-2.5-flash")
    # history: list of {role: 'user'|'bot', content: str}
    # Build a conversation string
    conversation = ''
    for msg in history:
        if msg['role'] == 'user':
            conversation += f"You: {msg['content']}\n"
        else:
            conversation += f"Bot: {msg['content']}\n"
    for attempt in range(retries):
        try:
            response = model.generate_content(conversation)
            return response.text.strip()
        except Exception as e:
            print(f"Error: {e}. Retrying in 2s...")
            time.sleep(2)
    return "Sorry, the service is currently unavailable. Please try again later."
@app.route('/')
def serve_index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'index.html')
@app.route('/api/submit', methods=['POST'])
def handle_submit():
    data = request.get_json()
    history = data.get('history', [])
    response = chat_with_gemini(history)
    return jsonify({'response': response})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)