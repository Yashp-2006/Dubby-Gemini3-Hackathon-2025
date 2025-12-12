# 🍊 Dubby: Your Dubbing Buddy
### *Speaking everyone's language, right on time.*

![Dubby Logo](https://raw.githubusercontent.com/[YOUR_USERNAME]/[REPO_NAME]/main/public/logo.png)
> 🏆 **Submission for the Google DeepMind "Vibe Code with Gemini 3 Pro" Competition**

## 💡 What is Dubby?
**Dubby** is an AI dubbing agent that solves the "Linguistic Time-Gap" in educational videos. Unlike standard translation tools that just translate words, Dubby translates **time**.

Using **Gemini 3 Pro**, Dubby acts as a "Dubbing Director." It watches your video, listens to the English audio, and rewrites the translation (in Spanish, Hindi, etc.) so that the spoken duration matches the original timestamps *exactly*. This ensures the audio never lags behind the visual animations.

## 🚀 Demo
* 🎥 **Video Demo:** [PASTE YOUR YOUTUBE/LOOM LINK HERE]
* ✨ **Try the App (Google AI Studio):** [PASTE YOUR PUBLISHED AI STUDIO LINK HERE]

---

## 🤖 How We "Vibe Coded" This
This entire application was built in under 48 hours using **Google AI Studio's Build Mode**. We didn't write manual synchronization algorithms; we prompted Gemini to "be the algorithm."

### The "Magic" System Prompt
The core logic relies on this system instruction given to Gemini:
> *"You are Dubby. Your goal is not literal accuracy, but 'temporal accuracy.' You must rewrite the target text so that it conveys the core meaning but fits strictly within the start and end timestamps of the source audio. You are editing for time."*

## 🛠️ Tech Stack
* **Brain:** Google Gemini 3 Pro / Gemini 1.5 Flash (via AI Studio)
* **Frontend:** React (Vibe Coded in AI Studio)
* **Audio:** Native Gemini Audio (with browser SpeechSynthesis fallback)
* **Styling:** Framer Motion (Animations) + Lucide React (Icons)

## 📦 How to Run Locally
Since this was built as a "Prompt-to-App" in AI Studio, the best way to run it is via the [Demo Link] above. However, if you want to run the code locally:

1.  Clone this repository.
    ```bash
    git clone [https://github.com/](https://github.com/)[YOUR_USERNAME]/dubby.git
    ```
2.  Install dependencies.
    ```bash
    npm install
    ```
3.  Add your API Key.
    * Create a `.env` file and add `REACT_APP_GEMINI_API_KEY=your_key_here`
4.  Run the development server.
    ```bash
    npm start
    ```

## ⚠️ Important Note on API Quotas
**Note to Judges:** Dubby runs on the **Gemini 3 Pro Experimental** model. Due to the high traffic of the hackathon, you may encounter a *"User has exceeded quota"* error when generating dubs.
* **If this happens:** Please refer to the **Video Demo** linked above to see the full functionality in action, including the synchronization engine and audio generation.

## 📄 License
This project is licensed under **CC BY 4.0** in accordance with the competition rules.
