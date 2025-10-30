# Vehicle Route Tracker (React + Leaflet)

A **real-time vehicle movement simulation** built with **React**, **Leaflet**, and **OpenStreetMap**.  
Visualizes a moving vehicle along a route — dynamically updating its **position**, **rotation**, and **path progress** just like ride-tracking apps.

---

## Live Demo

🔗 **[View Project Demo](https://vehicle-tracker-ashishpotrakonda.vercel.app/)**

---

## Features

**Real-Time Vehicle Movement** — Smooth, natural travel along a route  
**Dynamic Path Drawing** — Blue path = completed, Light Blue = remaining  
**Car Rotation** — Angle updates as per bearing  
**Auto Follow Mode** — Keeps car in view; user can freely explore map  
**Recenter Button** — Instantly refocus on the vehicle  
**Mobile Friendly UI** — Compact, responsive controls  
**Modular & Scalable** — Easily supports multiple vehicles or data sources

---

## Tech Stack

- **React**
- **Leaflet**
- **React-Leaflet**
- **Tailwind CSS**
- **React Icons**
- **Valhalla**

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/ashishpotrakonda/vehicle-tracker-app.git
cd vehicle-tracker-app
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm start
```

Visit **http://localhost:5173** in your browser.

---

## Extending the Project

- Fetch **real-time GPS data** from APIs or sockets.
- Display **speed, ETA, or distance** using helper functions.
- Integrate **search and route planning** using Valhalla or OSRM.
