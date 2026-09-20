import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';

import { API_BASE_URL } from '@/config/api';

export default function Index() {
  const [incomingText, setIncomingText] = useState('');
  const [reportText, setReportText] = useState('');
  const [isSecure, setIsSecure] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const SCAN_URL = `${API_BASE_URL}/api/scan`;
  const REPORT_URL = `${API_BASE_URL}/api/report`;

  // 2. Scan Function
  const scanMessageWithBackend = async () => {
    if (!incomingText.trim()) {
      Alert.alert("Empty Input", "Please type or paste a message to scan.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(SCAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: incomingText }),
      });
      const data = await response.json();
      setIsLoading(false);

      if (data.isScam) {
        setIsSecure(false);
        Alert.alert(
          "🚨 High Threat Detected!",
          `This message looks like a scam.\n\nReason: ${data.reason}`,
          [{ text: "Understood", onPress: () => setIsSecure(true) }]
        );
      } else {
        setIsSecure(true);
        Alert.alert("✅ Safe Message", "Our server analyzed the message and found no immediate threats.");
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("🔌 Connection Error", "Could not connect to the scan server.");
    }
  };

  // 3. New Report Function
  const reportNewScam = async () => {
    if (!reportText.trim()) {
      Alert.alert("Empty Input", "Please type the scam phrase you want to report.");
      return;
    }
    setIsReporting(true);
    try {
      const response = await fetch(REPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newScamPhrase: reportText }),
      });
      const data = await response.json();
      setIsReporting(false);

      if (data.success) {
        Alert.alert("🎉 Contribution Saved", data.message);
        setReportText(''); // Clear input box on success
      }
    } catch (error) {
      setIsReporting(false);
      Alert.alert("🔌 Connection Error", "Could not connect to the reporting server.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isSecure ? '#F3F4F6' : '#FEE2E2' }]}>
      <Text style={styles.title}>🛡️ UPI Shield Prototype</Text>
      <Text style={styles.subtitle}>Full-Stack Cybersecurity Engine</Text>
      
      {/* SCANNING SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 Threat Scanner</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste suspicious SMS text here..."
          multiline
          numberOfLines={3}
          value={incomingText}
          onChangeText={setIncomingText}
          placeholderTextColor="#9CA3AF"
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isLoading ? '#9CA3AF' : '#2563EB' }]} 
          onPress={scanMessageWithBackend}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Scan via Server</Text>}
        </TouchableOpacity>
      </View>

      {/* REPORTING SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 Crowdsource & Report a New Scam</Text>
        <Text style={styles.cardDescription}>Found a new scam keyword or trick? Add it to protect everyone.</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Free recharge link, part-time crypto job..."
          value={reportText}
          onChangeText={setReportText}
          placeholderTextColor="#9CA3AF"
          editable={!isReporting}
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isReporting ? '#9CA3AF' : '#059669' }]} 
          onPress={reportNewScam}
          disabled={isReporting}
        >
          {isReporting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Submit to Database</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 2 },
  subtitle: { fontSize: 13, textAlign: 'center', color: '#6B7280', marginBottom: 25, fontWeight: '600', letterSpacing: 0.5 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  cardDescription: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, textAlignVertical: 'top', marginBottom: 15, color: '#000000' },
  button: { padding: 14, borderRadius: 8, alignItems: 'center', height: 50, justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }
});
