# The Teatime: Autonomous AI-Native Newsroom
**Created for Vibeathon 2026**

The Teatime is an experimental, autonomous news service that eliminates human editors. It uses a high-intelligence AI pipeline (Llama 3.3 70B) to discover, research, write, and verify news stories in real-time based on global social and search trends. 

These are the screenshots with the working virlo API:
<img width="1886" height="940" alt="image" src="https://github.com/user-attachments/assets/d8a9690b-5beb-4455-ae3f-f829c6226734" />
<img width="1897" height="960" alt="image" src="https://github.com/user-attachments/assets/50f6d78b-41d4-4232-a46b-fd3eb2ef8a03" />




---

##  Virlo Intelligence Engine
The "soul" of The Teatime is its integration with the **Virlo.ai** intelligence cloud. We treat social trends as the primary signal for "what matters."

### What we fetch from Virlo:
1.  **Trends Digest (`/trends/digest`):** We fetch the top ranked global news clusters. If a topic has a high Virlo ranking, the pipeline automatically triggers a news report.
2.  **Social Visuals (`/instagram/videos/digest`):** We fetch the most viral video thumbnails and view counts to power the "Viral Visuals" monitor on every page.
3.  **Social Proof:** Every article in our system carries a **Social Pulse Indicator**, which displays the total views and "viral node hits" we fetched from Virlo for that specific story.
4.  **Global Niches:** We use the Virlo niche data to categorize our news (e.g., Tech & AI vs. Business & Finance) based on where the social momentum is highest.

---

##  Technology Stack
-   **Frontend:** Next.js 14 (App Router), Vanilla CSS, responsive Broadsheet masonry layout.
-   **Backend:** FastAPI (Python 3.10+), SQLite with `aiosqlite`.
-   **Editorial Engine:** Llama 3.3 70B (via Groq API) with custom XML-based parsing for 100% stable article generation.
-   **Deduplication:** Dual-layer system using exact URL matching + Semantic Clustering (Llama 3.1 8B).

---

##  Deployment Guide

### 1. Backend (FastAPI)
1.  Navigate to `/backend`.
2.  Install requirements: `pip install -r requirements.txt`.
3.  Set environment variables: 
    - `GROQ_API_KEY`: Your Groq platform key.
    - `VIRLO_API_KEY`: Your Virlo.ai credentials.
4.  Run server: `uvicorn main:app --port 8000`.

### 2. Frontend (Next.js)
1.  Navigate to `/frontend`.
2.  Install dependencies: `npm install`.
3.  Set environment variable: `BACKEND_URL` (points to your FastAPI instance).
4.  Run dev: `npm run dev` or build: `npm run build && npm start`.

---

##  The Pipeline Architecture
The Teatime doesn't just "scrape"—it thinks. Every 2 hours, the **Autonomous Pipeline** cycles through:
1.  **Discovery:** Fetches Virlo trends and RSS signals.
2.  **Cleaning:** Purges articles older than 24h to keep the "paper" fresh.
3.  **Clustering:** Prevents duplicate stories using a semantic cross-check against recent history.
4.  **Reporting:** Researches the story and writes a high-fidelity markdown report with a calculated Read Time.
5.  **Editing:** A separate "Editor Pass" polishes the headline and formatting for the broadsheet layout.

---
*© 2026 The Teatime. Reporting on the future.*
