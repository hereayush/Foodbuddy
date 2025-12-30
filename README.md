
# 🥗 FoodBuddy

**AI-Powered Ingredient Intelligence**

FoodBuddy is a modern web application that helps users understand food ingredients by analyzing their **health risks, environmental impact, and trade-offs** using Artificial Intelligence.
It transforms complex ingredient lists into **clear, structured, and explainable insights** for everyday consumers.

---

## 🌍 Problem Statement

Food product labels often contain long ingredient lists that are difficult for consumers to interpret.
Many ingredients may pose potential **health risks or environmental concerns**, but this information is not easily accessible or understandable.

There is a need for a tool that:

* Explains ingredients in simple language
* Highlights risks and benefits transparently
* Helps users make informed food choices

---

## 💡 Solution

**FoodBuddy** acts as a friendly AI companion that:

* Takes a list of food ingredients as input
* Uses an AI model to analyze potential risks and trade-offs
* Presents results in a **clean, visually structured dashboard**
* Focuses on **clarity, explainability, and user trust**

Instead of a chatbot-style response, FoodBuddy delivers **organized sections** such as Overview, Risks, Trade-offs, and Summary.

---

## ✨ Key Features

* 🧠 **AI-powered ingredient analysis**
* ⚠️ **Health & environmental risk identification**
* ⚖️ **Trade-off explanation**
* 📊 **Structured, readable output**
* 🌗 **Light & Dark mode**
* 🎨 **Modern glassmorphic UI**
* 📋 **Copy analysis to clipboard**
* ♿ **Accessible and user-friendly design**

---

## 🏗️ System Architecture

```
User Input (Ingredients)
        ↓
Frontend (React + Next.js)
        ↓
API Route (/api/analyze)
        ↓
LLM (Groq API)
        ↓
Structured JSON Response
        ↓
Visual Dashboard (FoodBuddy UI)
```

---

## 🛠️ Tech Stack

### Frontend

* **React**
* **Next.js (App Router)**
* Custom CSS (no heavy UI frameworks)
* Lucide Icons

### Backend

* Next.js API Routes
* Groq LLM API

### AI / ML

* Prompt-engineered Large Language Model
* Structured JSON responses for explainability

---

## 🖥️ Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/foodbuddy.git
cd foodbuddy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env.local` file:

```env
GROQ_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

---

## ⚠️ Disclaimer

FoodBuddy provides **general informational insights only**.
It does **not** replace professional medical, nutritional, or environmental advice.

---

## 🚀 Future Scope

* Barcode scanning for packaged foods
* Ingredient database integration
* Region-specific regulation analysis
* PDF / report export
* Mobile-first enhancements
* Multi-language support

---

## 🏁 Conclusion

FoodBuddy demonstrates how AI can be applied responsibly to improve consumer awareness.
By focusing on **structured explanations, modern UI, and ethical design**, the project highlights the potential of AI in everyday decision-making.


