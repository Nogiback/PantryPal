# 🛒 PantryPal

**Group #3 - Capstone Project**  
*PROG8950 - Computer Applications Development (Winter 2026)*  
*Conestoga College*

PantryPal is an intelligent kitchen companion designed to solve the daily mental load of meal planning. By deeply tracking your pantry inventory, parsing grocery receipts through AI vision, and querying custom smart recipes, PantryPal ensures you waste less food and spend less time stressing over what's for dinner.

---

## ✨ Features

- **Personalized Pantry Tracking:** Easily manage your ingredients, expiration dates, and quantities.
- **AI Receipt Scanning:** Powered by AWS Bedrock, automatically parse grocery receipts or images of your fridge to extract and add ingredients into your inventory.
- **Smart Recipe Generation:** Generate dynamic meals via the Spoonacular API perfectly matched to the ingredients *already* in your pantry. 100% ingredient match recipes are uniquely highlighted!
- **AI Recipe Generator:** Got some weird leftover ingredients? PantryPal leverages an LLM to generate a perfectly edible custom recipe to save your groceries from the trash.
- **Meal Planner & Shopping Lists:** Turn your favorite recipes into a weekly meal plan, automatically exporting the missing ingredients into a clean shopping list.

## 💻 Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS (v4), Framer Motion, Redux Toolkit
- **Backend:** Node.js API server
- **AI Integrations:** AWS Bedrock (Nova Lite Vision API)
- **Recipe Data:** Spoonacular API

---

## 🚀 Running Locally

To run the full PantryPal ecosystem locally, you will need to open **three** separate terminals to run the frontend UI and the two local Node backend APIs.

### 1. Installation

First, clone the repository and install all Node dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a single `.env` file in the root of the project with the following keys for both Spoonacular and AWS access:

```env
# AWS Bedrock Vision Keys
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
PORT=8787

# Spoonacular API Keys
SPOONACULAR_API_BASE_URL=https://api.spoonacular.com
SPOONACULAR_API_KEYS=your_spoonacular_key_1,your_spoonacular_key_2
USER_DATA_PORT=8788
```

### 3. Start the Servers

In your **first terminal**, start the Claude/AWS Bedrock proxy server for the Receipt Scanner:
```bash
npm run dev:api
```

In your **second terminal**, start the User Data and Spoonacular proxy server:
```bash
npm run dev:user
```

In your **third terminal**, start the Vite React Frontend:
```bash
npm run dev
```

The PantryPal application will now be accessible locally via your browser (typically `http://localhost:5173`). Happy cooking!
