# Modern TO-DO Application

**Project by: Team Lead Chinaza & Co.**  
*This document outlines our app's features, architecture, and team contributions. It is structured to be easily converted into presentation slides.*

---

## 📱 Slide 1: App Overview
The **Modern TO-DO App** is a feature-rich, responsive task manager designed to boost productivity through an intuitive interface and deeply customizable controls. 
- **Dynamic Theming**: Enjoy a beautifully crafted Light Green Gradient (default), alongside professional Light and Dark modes.
- **Smart Reminders**: Never miss a beat with an in-app alarm modal, 5-minute snooze mechanics, and customizable audio alerts (Beep, Chime, Buzz).
- **Pro-level Task Management**: Supports granular control including Subtasks, drag-and-drop reordering, and Repeating tasks (Daily, Weekly, Monthly).
- **Persistent Data**: 100% offline-ready using robust Local Storage.

---

## 👥 Slide 2: Meet the Team & Role Delegation

Our success is built on clear divisions of specialized tasks:

- 👑 **Chinaza (Group Leader & PM)**
  - Project architecture, workflow management, and overall product vision.
  
- 🎨 **Tolu (UI/UX & Theming)**
  - Application aesthetics, Light/Dark/Green theme gradients, and smooth CSS transitions.

- 🏗️ **Ali (Frontend Layout)**
  - Core HTML structure, glassmorphism design implementation, and responsive mobile layout scaling.

- ⚙️ **Denzel (Core Logic)**
  - JavaScript implementation for primary CRUD operations (Add, Edit, Delete, Search filtering).

- 📋 **Esther (Task Granularity)**
  - Implementation of nested Subtasks logic and the dynamic Detail View routing.

- 🔊 **Micheal (Audio & Notifications)**
  - Custom Web Audio API integration for custom sounds, Snooze logic, and in-app Modal popups.

- 🔁 **Ruben (Advanced Interactions)**
  - HTML5 Drag & Drop reordering mechanics and algorithmic handling of Repeating interval tasks.

- 💾 **Onovo (Data & QA)**
  - Data JSON serialization, Local Storage persistence, input validation, and Quality Assurance testing.

---

## 💻 Slide 3: Technical Highlights
- **No Frameworks**: 100% Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Web Audio API**: Real-time generation of oscillators (sine, sawtooth) to create custom Chime and Buzz alarms without relying on external `.mp3` files.
- **Advanced State Management**: Everything is dynamically rendered from memory and effortlessly paired with the browser's Local Storage APIs.

---

## 🚀 Slide 4: Getting Started
1. **Download** the project folder.
2. **Open `index.html`** in any modern web browser (Chrome, Firefox, Safari, Edge).
3. **Customize your space**: Switch the theme using the top-right toggle icon.
4. **Test the Alarms**: Create a task with a reminder set for 1 minute in the future, select the "Chime" sound, and wait for the custom snooze modal to trigger!