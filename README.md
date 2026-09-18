# Solarah ☀️

### Global Renewable Energy Advisory Platform

> An engineering-focused web application designed to make early-stage residential solar planning more accessible.

**Designed and developed by Mouayad Alhabbal**
*Sustainable Design Engineering · Renewable Energy & Mechatronics*

**Status:** MVP / Active Development
**Built with:** React 18 · Vite · Supabase · JavaScript · jsPDF · Claude API

---

## Overview

Solarah explores how residential solar planning can be simplified through a digital engineering workflow.

Users provide information such as their **location, electricity consumption, and budget**, and the platform generates an initial photovoltaic system recommendation covering key components such as **solar panels, an inverter, and battery storage**.

The project combines **renewable energy engineering concepts with software development**, bringing system estimation, automated reporting, product exploration, and access to engineering consultation into a single platform.

> ⚠️ **MVP / Engineering Prototype:** Solarah is currently under active development. Calculator outputs are intended for preliminary planning and demonstration purposes and should not replace a professional site assessment or certified engineering design.

---

## What's Inside

### ☀️ PV System Calculator

A four-step workflow that estimates a residential photovoltaic system based on user inputs such as:

* Location
* Electricity consumption
* Budget
* System requirements

The calculator provides an initial sizing recommendation for:

* Solar panels
* Inverter
* Battery storage

The underlying calculation logic is implemented in `src/lib/calculator.js`.

### 🤖 AI-Assisted Reports

Solarah can generate a personalized written analysis of the calculated system using the **Claude API**.

The goal is to translate technical calculation results into information that is easier for non-specialist users to understand.

### 📄 PDF Report Generation

Calculated results can be exported as a branded PDF directly from the browser using **jsPDF**.

### 👷 Engineer Marketplace

The platform includes an engineer marketplace concept where users can:

* Browse engineering profiles
* View available consultation slots
* Book virtual consultations

The booking architecture is supported by Supabase tables for engineers, availability slots, and bookings.

### 🛒 Renewable Energy Products

Solarah includes a product recommendation interface for solar equipment such as:

* PV panels
* Inverters
* Batteries

The project includes an affiliate-link architecture and click tracking for future supplier integrations.

### 📋 Waitlist

A pre-launch waitlist allows users to submit their email address for future updates.

### 🔐 Authentication & Dashboard

Supabase provides the authentication and database layer for:

* User accounts
* Saved reports
* Booking history
* Application data

### 🌍 English & Arabic

The application includes internationalization support for **English and Arabic**, reflecting the project's initial focus on making renewable-energy information more accessible across different markets.

---

## Engineering Focus

Solarah is not intended to replace a professional solar design process.

The project focuses on the **early-stage feasibility and advisory layer** of residential PV adoption:

```text
User Information
       ↓
Solar Resource / Energy Inputs
       ↓
PV System Estimation
       ↓
Component Recommendation
       ↓
Technical Analysis
       ↓
PDF Report
       ↓
Optional Engineering Consultation
```

The broader objective is to explore how renewable-energy engineering can be combined with software to reduce the technical barrier to understanding residential solar systems.

---

## Technology Stack

| Technology       | Purpose                                |
| ---------------- | -------------------------------------- |
| **React 18**     | Frontend application                   |
| **Vite**         | Development and build tooling          |
| **React Router** | Application routing                    |
| **JavaScript**   | Application and calculation logic      |
| **Supabase**     | Authentication and PostgreSQL database |
| **jsPDF**        | Client-side PDF generation             |
| **Claude API**   | AI-assisted report analysis            |
| **Tabler Icons** | User interface icons                   |

---

## Project Structure

```text
solarah/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
│
├── supabase/
│   └── schema.sql
│
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── components/
    │   ├── Footer.jsx
    │   ├── LanguageSwitcher.jsx
    │   ├── Navbar.jsx
    │   └── Sunora.jsx
    │
    ├── lib/
    │   ├── calculator.js
    │   ├── images.js
    │   ├── pdf.js
    │   ├── supabase.js
    │   └── useReveal.js
    │
    ├── locales/
    │   ├── ar.json
    │   └── en.json
    │
    ├── pages/
    │   ├── Auth.jsx
    │   ├── Calculator.jsx
    │   ├── Dashboard.jsx
    │   ├── Engineers.jsx
    │   ├── Landing.jsx
    │   ├── Products.jsx
    │   ├── SunPath.jsx
    │   └── Waitlist.jsx
    │
    └── styles/
        └── global.css
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/moayedalhabbal-svg/Solarah.git
cd Solarah
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a Supabase project and open the **SQL Editor**.

Run the schema provided in:

```text
supabase/schema.sql
```

This initializes the database structure used by the application.

### 4. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then add your Supabase project credentials:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Never commit your `.env` file or private API keys to the repository.**

### 5. Run the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

### 6. Build for production

```bash
npm run build
```

The production build is generated in:

```text
dist/
```

---

## Current Development Status

Solarah is currently an **MVP under active development**.

### Implemented

* [x] React/Vite application architecture
* [x] Residential PV system calculator
* [x] Solar component estimation
* [x] AI-assisted report generation
* [x] PDF report generation
* [x] Supabase authentication architecture
* [x] Database schema
* [x] User dashboard
* [x] Engineer marketplace interface
* [x] Consultation booking architecture
* [x] Product recommendation interface
* [x] Affiliate click tracking architecture
* [x] Waitlist functionality
* [x] English / Arabic localization

### Planned

* [ ] Production deployment
* [ ] Backend API/Edge Function for Claude API requests
* [ ] Real engineer availability and onboarding
* [ ] Real supplier and affiliate partnerships
* [ ] Booking confirmation emails
* [ ] Production analytics
* [ ] Custom domain
* [ ] Further validation of PV sizing methodology against professional design workflows

---

## Security Note

The current MVP includes a direct browser-side Claude API integration for demonstration purposes.

Before production deployment, the AI request should be moved to a **secure backend route or Supabase Edge Function** so that private API credentials are never exposed to users.

Environment variables containing credentials are excluded from version control through `.gitignore`.

---

## Future Direction

Solarah is being developed as an exploration of how **renewable-energy engineering, software, and digital advisory services** can work together.

Future development is intended to expand the platform from preliminary PV estimation toward a broader workflow connecting:

**Solar assessment → System design → Engineering consultation → Equipment selection → Deployment**

---

## Author

**Mouayad Alhabbal**

Sustainable Design Engineering
Renewable Energy · Mechatronics · Sustainable Technology

GitHub:
https://github.com/moayedalhabbal-svg

---

*Solarah — Making renewable energy planning more accessible through engineering and technology.* ☀️
