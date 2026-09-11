import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BACKEND_URL = 'http://10.146.240.249:8000';

export default function App() {
  const [location, setLocation] = useState('Rewari, Haryana');
  const [weather, setWeather] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWeather();
  }, []);

  async function loadWeather() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/weather?location=${encodeURIComponent(location)}`);
      if (!response.ok) throw new Error('Weather service unavailable');
      const result = await response.json();
      setWeather(result.data);
    } catch (requestError) {
      setError(`${requestError.message}. Update BACKEND_URL for a physical phone.`);
    } finally {
      setLoading(false);
    }
  }

  async function askWeatherGPT() {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question.trim(), location, persona: 'citizen', language: 'en' }),
      });
      if (!response.ok) throw new Error('AI service unavailable');
      const result = await response.json();
      setAnswer(result.response || 'No answer received.');
      setQuestion('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>WEATHERGPT</Text>
        <Text style={styles.title}>Weather that speaks plainly.</Text>
        <Text style={styles.subtitle}>Live conditions and practical advice for your day.</Text>

        <View style={styles.locationRow}>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="City or district"
            placeholderTextColor="#817b70"
            style={styles.locationInput}
          />
          <TouchableOpacity onPress={loadWeather} style={styles.button} accessibilityLabel="Refresh weather">
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weatherCard}>
          <Text style={styles.cardLabel}>CURRENT CONDITIONS</Text>
          {loading && !weather ? <ActivityIndicator color="#f4f0e8" /> : null}
          {weather ? (
            <>
              <Text style={styles.temperature}>{weather.current?.temperature_2m ?? '--'}°</Text>
              <Text style={styles.condition}>{weather.current?.condition_text || 'Conditions available'}</Text>
              <Text style={styles.detail}>Feels like {weather.current?.apparent_temperature ?? '--'}°  •  Humidity {weather.current?.relative_humidity_2m ?? '--'}%</Text>
            </>
          ) : !loading ? <Text style={styles.empty}>Connect the backend to load live weather.</Text> : null}
        </View>

        <View style={styles.askSection}>
          <Text style={styles.sectionTitle}>Ask WeatherGPT</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Will it rain this evening?"
            placeholderTextColor="#817b70"
            style={styles.questionInput}
            multiline
          />
          <TouchableOpacity onPress={askWeatherGPT} style={styles.askButton} disabled={loading}>
            <Text style={styles.askButtonText}>{loading ? 'Thinking...' : 'Ask AI'}</Text>
          </TouchableOpacity>
          {answer ? <Text style={styles.answer}>{answer}</Text> : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.networkNote}>Android emulator backend: 10.0.2.2:8000</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f0e8' },
  container: { padding: 24, paddingBottom: 40 },
  kicker: { color: '#b4542f', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#20251f', fontSize: 38, fontWeight: '800', lineHeight: 43, marginTop: 10 },
  subtitle: { color: '#5f6259', fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 24 },
  locationRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  locationInput: { flex: 1, backgroundColor: '#fffaf1', borderColor: '#d8d0c2', borderWidth: 1, borderRadius: 8, color: '#20251f', padding: 14, fontSize: 15 },
  button: { alignItems: 'center', backgroundColor: '#20251f', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { color: '#fffaf1', fontWeight: '700' },
  weatherCard: { backgroundColor: '#244b45', borderRadius: 12, minHeight: 190, padding: 22 },
  cardLabel: { color: '#b9d1b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  temperature: { color: '#fffaf1', fontSize: 64, fontWeight: '800', marginTop: 18 },
  condition: { color: '#fffaf1', fontSize: 20, fontWeight: '700' },
  detail: { color: '#cfe0cf', fontSize: 14, marginTop: 10 },
  empty: { color: '#cfe0cf', marginTop: 30 },
  askSection: { marginTop: 28 },
  sectionTitle: { color: '#20251f', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  questionInput: { backgroundColor: '#fffaf1', borderColor: '#d8d0c2', borderWidth: 1, borderRadius: 8, color: '#20251f', minHeight: 86, padding: 14, textAlignVertical: 'top' },
  askButton: { alignItems: 'center', backgroundColor: '#b4542f', borderRadius: 8, marginTop: 10, padding: 15 },
  askButtonText: { color: '#fffaf1', fontSize: 16, fontWeight: '800' },
  answer: { backgroundColor: '#fffaf1', borderLeftColor: '#b4542f', borderLeftWidth: 4, color: '#30342e', fontSize: 16, lineHeight: 24, marginTop: 16, padding: 15 },
  error: { color: '#a23c2a', lineHeight: 20, marginTop: 18 },
  networkNote: { color: '#817b70', fontSize: 12, marginTop: 28 },
});