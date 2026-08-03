# 🫀 Arogya Pharmacy Delivery App

[![Expo](https://img.shields.io/badge/Expo-54-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.74.5-61DAFB)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.49.4-3ECF8E)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6)](https://typescriptlang.org)

A full-featured pharmacy delivery application built with **React Native Expo**, **Supabase**, and **TypeScript**. It provides a seamless experience for both customers and pharmacists, similar to Uber Eats but for pharmacy delivery.

## 📱 Features

### 👤 User Features

| Feature | Description |
|---------|-------------|
| **🔐 OTP Authentication** | Secure phone number login with OTP verification |
| **📦 Product Browsing** | Browse medicines with categories, popular items, and new arrivals |
| **🔍 Advanced Search** | Real-time product search with dropdown suggestions |
| **🛒 Shopping Cart** | Add products with color variants and quantity management |
| **📋 Order Management** | Track order status: Pending → Picking → Packing → Shipping → Delivered |
| **🔑 Delivery Code System** | 4-digit delivery codes for secure handover |
| **💬 Real-time Chat** | Chat with pharmacist with prescription upload |
| **🔔 Push Notifications** | Order updates and message notifications |
| **💳 Payment Options** | Cash on Delivery and Card Payment |
| **👤 User Profile** | Avatar upload, profile editing, order history |

### 👨‍⚕️ Pharmacist Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Overview of orders, revenue, and products |
| **📦 Product Management** | Add, edit, delete, publish/unpublish products |
| **📋 Order Management** | Update order status with delivery code generation |
| **💬 Customer Communication** | Real-time chat with customers |
| **📈 Order Tracking** | Track all orders with status counts |

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Icons**: @expo/vector-icons

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: OTP via SMS (development mode)
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### Tools
- **Language**: TypeScript
- **Image Picker**: Expo Image Picker
- **Notifications**: Expo Notifications

## 📸 Screenshots
[!ScreenShots](https://drive.google.com/drive/folders/1up51vho_Hvb7Gzr0lpz-nHj4Djk1Ch3B?usp=drive_link)]

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Expo Go app (for testing on physical device)

### Clone the Repository

```bash
git clone https://github.com/yourusername/arogya-pharmacy-app.git
cd arogya-pharmacy-app
