# WeatherGPT Expo client

This is the React Native client for Expo Go. It uses the existing FastAPI backend.

```powershell
cd expo-app
npm install
npx expo start
```

Scan the QR code with Expo Go. The client is configured for this computer's current Wi-Fi address (`http://10.146.240.249:8000`). Keep the phone and computer on the same Wi-Fi network. If the address changes, update `BACKEND_URL` in `App.js`.

For an Android emulator, use `http://10.0.2.2:8000` instead. The backend must listen on the LAN interface, such as `uvicorn main:app --host 0.0.0.0 --port 8000`.