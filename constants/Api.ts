import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web
// For physical devices, replace with your local IP address
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:5000', // Emulator
    ios: 'http://localhost:5000',     // Simulator
    default: 'http://10.217.16.234:5000', // Physical Device (Auto-detected IP)
});

export const API_URL = `${BASE_URL}/api`;
