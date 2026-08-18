# examPaper - Comprehensive User Guide

**examPaper** is an AI-powered academic intelligence and examination ecosystem built for modern higher education. It features real-time exam administration, non-intrusive proctoring, AI-assisted question generation, deep cognitive performance analytics, and complete VoiceOver accessibility for blind and visually impaired students.

---

## 🧭 Platform Access & Role Switcher

examPaper supports three distinct user roles: **Student**, **Teacher**, and **Administrator**.

### 1. Developer Role Switcher (Instant Demo Bar)
At the very top of the screen, a convenient **Demo Actor Switcher Bar** allows evaluators to toggle seamlessly between active roles without re-logging:
- **Student Demo**: Simulates candidate access for active exam rooms and diagnostic review.
- **Teacher Demo**: Simulates educator access for room creation, question authoring, live proctoring, and class diagnostics.
- **Admin Demo**: Simulates system administration for approving new teacher registrations.

### 2. User Authentication & Registration
- **Sign In**: Enter registered email and password credentials.
- **Registration**: Toggle **"Create Account"** to register as either a **Student** or a **Teacher**.
  - Student accounts gain instant access upon registration.
  - Teacher accounts are queued for **Administrator Approval** prior to full portal access.

---

## 🎓 Student Portal Guide

### 1. Joining an Examination
1. Navigate to the **Student Portal**.
2. Enter the **6-Digit Exam Room Code** provided by your teacher (e.g., `849201`).
3. Click **"Join Examination Room"**.
4. If the room is in **Lobby Mode**, you will see a waiting screen with exam instructions until your teacher starts the assessment.

### 2. Active Exam Interface & Navigation
- **Question Layout**: Questions are displayed with multiple-choice options (A, B, C, D).
- **Progress Tracking**: A progress bar shows completed questions versus total questions.
- **Timer & Auto-Save**: An active timer counts down remaining exam time. All selected answers are cached automatically in local memory to prevent data loss in case of unexpected network drops.
- **Navigation Controls**: Use the on-screen **"Previous Question"** and **"Next Question"** buttons to move between items.

### 3. macOS & VoiceOver Blind Mode Shortcuts
examPaper includes built-in keyboard navigation optimized for macOS and iOS VoiceOver users:

| Feature / Action | macOS / VoiceOver Shortcut | Description |
| :--- | :--- | :--- |
| **Accessibility Panel** | `Option ⌥ + A` *(or `⌘ + ⌥ + A`)* | Opens the floating Accessibility & Screen Reader settings modal. |
| **Read Aloud** | `Option ⌥ + R` *(or `⌘ + ⌥ + R`)* | Speaks the active question text and choices using speech synthesis. |
| **Skip to Main Content** | `Option ⌥ + 1` *(or `⌘ + ⌥ + 1`)* | Instantly shifts browser focus to the main exam workspace. |
| **Select Choice A** | `Option ⌥ + A` or `Option ⌥ + 1` | Selects option A and provides speech confirmation. |
| **Select Choice B** | `Option ⌥ + B` or `Option ⌥ + 2` | Selects option B and provides speech confirmation. |
| **Select Choice C** | `Option ⌥ + C` or `Option ⌥ + 3` | Selects option C and provides speech confirmation. |
| **Select Choice D** | `Option ⌥ + D` or `Option ⌥ + 4` | Selects option D and provides speech confirmation. |
| **Next Question** | `Option ⌥ + Right Arrow` | Navigates forward and reads the new question aloud. |
| **Previous Question** | `Option ⌥ + Left Arrow` | Navigates backward and reads the previous question. |
| **Submit Assessment** | `Option ⌥ + S` | Submits the completed exam. |

### 4. Diagnostic Exam Results & AI Tutoring
After submitting an assessment, students receive an instant diagnostic breakdown:
- **Score Breakdown**: Final percentage score, letter grade, and pass/fail indicator.
- **Timing Metrics**: Average time spent per question and total completion speed.
- **Question Review**: Detailed review of correct vs. incorrect answers with explanation notes.
- **Gemini AI Diagnostic Report**: Personal AI tutor insights identifying logic gaps and providing tailored study recommendations.

---

## 👩‍🏫 Teacher Portal Guide

### 1. Creating Exam Rooms
1. In the **Teacher Portal**, click **"Create New Room"**.
2. Enter the **Exam Title**, **Subject / Category**, and **Time Limit** (in minutes).
3. Click **"Save Exam Room"**. A unique 6-digit room code will be generated.

### 2. Adding & Generating Questions
Educators can add questions manually or leverage **Gemini AI Question Generation**:
- **Manual Questions**: Enter question text, four choices (A, B, C, D), specify the correct answer, and provide an explanation.
- **AI Question Generation**: Click **"Generate Questions with AI"**, enter a topic or subject prompt (e.g., *"Calculus integration methods"*), select difficulty and question count, and click **"Generate"**.

### 3. Live Proctoring & Room Control
- **Lobby Controls**: Teachers can toggle rooms between **Lobby Mode** (holding candidates) and **Live Mode** (active exam execution).
- **Live Tab-Switch Tracking**: Non-intrusive telemetry logs student focus loss, window blurring, and tab-switching events in real time with exact timestamps.

### 4. Class Analytics & AI Diagnostic Chatbot
- **Class Accuracy Charts**: Interactive `recharts` visualizer depicting classroom accuracy distributions.
- **Cognitive Speed Analytics**: Metrics highlighting hardest/most time-consuming questions versus immediate confidence fields.
- **Interactive AI Class Performance Diagnostic Chat**: Ask Gemini natural language questions about overall class results (e.g., *"Which concepts gave students the most trouble?"* or *"Summarize top areas for revision"*).

---

## 🛡️ Admin Portal Guide

The **Admin Portal** manages user approvals and system oversight:
- **Teacher Approval Queue**: View pending educator registration requests.
- **Approve / Reject**: Click **"Approve"** to grant teacher authoring privileges, or **"Reject"** to deny access.
- **Platform Telemetry**: Inspect overall student, teacher, and exam count metrics across the system.

---

## 🎨 Accessibility & Theme Customization

### 1. Light Mode & Dark Mode
- Toggle between **Dark Mode** and the high-contrast **Light Mode** palette using the **Sun / Moon icon** in the top navigation bar or inside the Accessibility Panel.
- Your theme selection is automatically saved in browser storage.

### 2. Multilingual Support
- Switch between **English (EN)**, **Uzbek (UZ)**, and **Russian (RU)** using the language selector drop-down in the header.

### 3. Screen Reader Controls (Alt+A / Option+A)
- Adjust **Speech Speed** (0.75x to 1.5x) for audio narration.
- Customize **Text Sizing** (Normal, Large 120%, X-Large 140%).
- Toggle **High Contrast Mode** for enhanced visual contrast.
