# NexTalk - Premium Messaging Experience 🚀

NexTalk is a high-end, real-time messaging application built with a focus on **Premium Aesthetics**, **Fluid Animations**, and **Scalable Architecture**. Designed for those who appreciate modern UI/UX principles like Glassmorphism and sophisticated interaction design.

![Banner](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1200&auto=format&fit=crop)

## ✨ Key Features

- **💎 Elite Design**: A "Premium Indigo" aesthetic featuring glassmorphism, depth-based shadows, and curated color palettes.
- **⚡ Real-Time Core**: Instant message delivery and presence synchronization powered by WebSockets.
- **🎭 Stories & Moments**: Share your day with a high-end, interactive Story viewer with progress bars and quick reactions.
- **🤖 NexBot AI**: A smart companion integrated directly into your chat experience (Powered by Gemini AI).
- **📞 Call History**: Professional call logs with date grouping (Today, Yesterday, Earlier) and distinct status indicators.
- **🔒 End-to-End Style**: Secure-looking onboarding and authentication flows with fluid step transitions.
- **📁 Multimedia Ready**: Share images and voice notes seamlessly across conversations.

## 🛠 Tech Stack

### Frontend (Mobile)
- **Framework**: React Native (Expo Go)
- **State Management**: Zustand
- **Navigation**: Expo Router (File-based)
- **Styling**: Vanilla CSS with Linear Gradients & Shadows
- **Animations**: React Native Reanimated & Animated API
- **Icons**: Lucide React Native

### Backend (API)
- **Language**: Golang
- **Web Framework**: Fiber (Express-inspired, high performance)
- **Database**: PostgreSQL (GORM)
- **Cache/Realtime**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Realtime**: Gorilla WebSocket

## 🚀 Getting Started

### Prerequisites
- Node.js & npm (for Mobile)
- Go 1.21+ (for Backend)
- Docker & Docker Compose (for Postgres & Redis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NexTalk-SocialMessageApp.git
   ```

2. **Spin up Infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Setup Backend**
   ```bash
   cd backend
   go mod download
   # Update .env with your credentials
   go run cmd/api/main.go
   ```

4. **Setup Mobile**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

## 📸 Presentation Mode
This repository is currently configured for documentation and portfolio showcases. It includes high-quality **Premium Dummy Data** (featuring the "kenzama" persona) to ensure a polished look even without a live backend connection.

---

Built with ❤️ by [Your Name/Team]
