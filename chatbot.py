import google.generativeai as genai

# Set up API key
genai.configure(api_key="AIzaSyBCXoqlPPSRdfjzech8soIw6FLqOKjwrVI")

def chat_with_gemini(prompt):
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()

if __name__ == "__main__":
    attempts = 3
    while attempts > 0:
        password = input("ENTER PASSWORD: ")
        if password == "KEERTHAN":
            break
        attempts -= 1
        print(f"WRONG PASSWORD. ONLY {attempts} ATTEMPT(S) LEFT")

    if attempts > 0:
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["quit", "exit", "bye"]:
                print("Chatbot: Goodbye!")
                break
            response = chat_with_gemini(user_input)
            print("Chatbot:", response)
    else:
        print("Access denied.")
