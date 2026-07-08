import { useState, useEffect } from "react"
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,
} from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { useAuth } from "../_layout"
import { uploadApi, banksApi } from "../../lib/api"

export default function UploadScreen() {
  const { token } = useAuth()
  const [banks, setBanks] = useState<any[]>([])
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [file, setFile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!token) return
    banksApi.list(token).then((res) => {
      setBanks(res.banks)
      if (res.banks.length > 0) setSelectedBank(res.banks[0].id)
    }).catch(console.error)
  }, [token])

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets?.[0]) {
        setFile(result.assets[0])
        setResult(null)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file")
    }
  }

  const handleUpload = async () => {
    if (!file || !selectedBank || !token) {
      Alert.alert("Error", "Please select a bank and a file")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      } as any)
      formData.append("bankAccountId", selectedBank)

      const uploadResult = await uploadApi.statement(token, formData)
      setResult(uploadResult)
      setFile(null)
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Could not process the file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload Statement</Text>
      <Text style={styles.subtitle}>Upload your bank statement (PDF, CSV, or Excel)</Text>

      {/* Bank Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Bank Account</Text>
        {banks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bank accounts added yet. Go to Settings to add one.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
            {banks.map((bank) => (
              <TouchableOpacity
                key={bank.id}
                style={[styles.bankChip, selectedBank === bank.id && styles.bankChipActive]}
                onPress={() => setSelectedBank(bank.id)}
              >
                <Text style={[styles.bankChipText, selectedBank === bank.id && styles.bankChipTextActive]}>
                  {bank.bankName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* File Picker */}
      <TouchableOpacity style={styles.filePickerButton} onPress={pickFile}>
        <Text style={styles.filePickerIcon}>{file ? "📄" : "📁"}</Text>
        <Text style={styles.filePickerText}>
          {file ? file.name : "Tap to select a file"}
        </Text>
        {file && (
          <Text style={styles.fileSize}>
            {(file.size / 1024).toFixed(0)} KB
          </Text>
        )}
      </TouchableOpacity>

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, (!file || !selectedBank || uploading) && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={!file || !selectedBank || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload & Process</Text>
        )}
      </TouchableOpacity>

      {/* Result */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>✅</Text>
          <Text style={styles.resultText}>{result.message}</Text>
          <View style={styles.resultStats}>
            <Text style={styles.resultStat}>Added: {result.transactionsAdded}</Text>
            <Text style={styles.resultStat}>Skipped: {result.transactionsSkipped}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingTop: 16 },
  title: { fontSize: 24, color: "#f8fafc", fontWeight: "800" },
  subtitle: { fontSize: 14, color: "#94a3b8", marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, color: "#94a3b8", fontWeight: "600", marginBottom: 8 },
  bankScroll: { flexDirection: "row" },
  bankChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: "#1e293b", marginRight: 8, borderWidth: 1, borderColor: "#334155",
  },
  bankChipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  bankChipText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  bankChipTextActive: { color: "#fff" },
  emptyCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 20, borderWidth: 1, borderColor: "#334155" },
  emptyText: { color: "#64748b", textAlign: "center" },
  filePickerButton: {
    backgroundColor: "#1e293b", borderRadius: 16, padding: 32, alignItems: "center",
    borderWidth: 2, borderColor: "#334155", borderStyle: "dashed", marginBottom: 20,
  },
  filePickerIcon: { fontSize: 40, marginBottom: 12 },
  filePickerText: { fontSize: 15, color: "#94a3b8", fontWeight: "500" },
  fileSize: { fontSize: 12, color: "#64748b", marginTop: 4 },
  uploadButton: { backgroundColor: "#6366f1", borderRadius: 12, padding: 16, alignItems: "center" },
  uploadButtonDisabled: { opacity: 0.4 },
  uploadButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resultCard: {
    backgroundColor: "#1e293b", borderRadius: 16, padding: 24, marginTop: 24,
    alignItems: "center", borderWidth: 1, borderColor: "#22c55e33",
  },
  resultIcon: { fontSize: 40, marginBottom: 12 },
  resultText: { color: "#f8fafc", fontSize: 15, fontWeight: "600", textAlign: "center" },
  resultStats: { flexDirection: "row", gap: 16, marginTop: 12 },
  resultStat: { color: "#94a3b8", fontSize: 13 },
})
