import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  next_dose_time: string;
}

export default function AdherenceScreen() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [medicationPhoto, setMedicationPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [captureStep, setCaptureStep] = useState<'medication' | 'selfie'>('medication');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    }
  };

  const requestPermission = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Camera permission is required to take adherence photos');
        return false;
      }
    }
    return true;
  };

  const startAdherenceCapture = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowCamera(true);
    setCaptureStep('medication');
    setMedicationPhoto(null);
    setSelfiePhoto(null);
    setNotes('');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });

        if (captureStep === 'medication') {
          setMedicationPhoto(photo.uri);
          setCaptureStep('selfie');
          setCameraType('front');
        } else {
          setSelfiePhoto(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const uploadPhoto = async (uri: string, type: 'medication' | 'selfie'): Promise<string> => {
    const fileExt = uri.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `adherence/${user?.id}/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('adherence-photos')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('adherence-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const submitAdherenceLog = async () => {
    if (!selectedPrescription || !medicationPhoto || !selfiePhoto) {
      Alert.alert('Error', 'Both photos are required');
      return;
    }

    setLoading(true);
    try {
      // Upload photos
      const [medicationUrl, selfieUrl] = await Promise.all([
        uploadPhoto(medicationPhoto, 'medication'),
        uploadPhoto(selfiePhoto, 'selfie'),
      ]);

      // Get patient ID
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!patientData) {
        throw new Error('Patient profile not found');
      }

      // Create adherence log
      const { error } = await supabase
        .from('adherence_logs')
        .insert({
          patient_id: patientData.id,
          prescription_id: selectedPrescription.id,
          adherence_date: new Date().toISOString().split('T')[0],
          taken_at: new Date().toISOString(),
          photo_url: medicationUrl,
          selfie_url: selfieUrl,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      // Create notification for PMO
      await supabase
        .from('notifications')
        .insert({
          user_id: (await supabase
            .from('patients')
            .select('assigned_pmo_id')
            .eq('user_id', user?.id)
            .single()
          ).data?.assigned_pmo_id,
          type: 'medication_reminder',
          title: 'New Adherence Submission',
          message: `Patient has submitted adherence proof for ${selectedPrescription.medication_name}`,
          data: {
            prescription_id: selectedPrescription.id,
            patient_id: patientData.id,
          },
        });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting adherence log:', error);
      Alert.alert('Error', 'Failed to submit adherence log');
    } finally {
      setLoading(false);
    }
  };

  const cancelCapture = () => {
    setShowCamera(false);
    setMedicationPhoto(null);
    setSelfiePhoto(null);
    setSelectedPrescription(null);
    setNotes('');
    setCameraType('back');
  };

  if (!cameraPermission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Adherence</Text>
          <Text style={styles.subtitle}>Log your medication intake</Text>
        </View>

        <View style={styles.prescriptionsContainer}>
          <Text style={styles.sectionTitle}>Today's Medications</Text>
          {prescriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active prescriptions</Text>
            </View>
          ) : (
            prescriptions.map((prescription) => (
              <View key={prescription.id} style={styles.prescriptionCard}>
                <View style={styles.prescriptionInfo}>
                  <Text style={styles.medicationName}>{prescription.medication_name}</Text>
                  <Text style={styles.dosage}>{prescription.dosage} - {prescription.frequency}</Text>
                </View>
                <TouchableOpacity
                  style={styles.logButton}
                  onPress={() => startAdherenceCapture(prescription)}
                >
                  <Text style={styles.logButtonText}>Log Intake</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelCapture}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>
              {captureStep === 'medication' ? 'Medication Photo' : 'Selfie Verification'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
          />

          <View style={styles.cameraFooter}>
            <Text style={styles.cameraInstruction}>
              {captureStep === 'medication'
                ? 'Take a clear photo of your medication and water glass'
                : 'Take a selfie showing you taking the medication'}
            </Text>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Preview and Submit Modal */}
      <Modal
        visible={!!selectedPrescription && !showCamera && !!medicationPhoto && !!selfiePhoto}
        animationType="slide"
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={cancelCapture}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Review Photos</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.previewContent}>
            <View style={styles.photoSection}>
              <Text style={styles.photoSectionTitle}>Medication Photo</Text>
              <Image source={{ uri: medicationPhoto }} style={styles.previewImage} />
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.photoSectionTitle}>Selfie Verification</Text>
              <Image source={{ uri: selfiePhoto }} style={styles.previewImage} />
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any side effects or concerns?"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={submitAdherenceLog}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Adherence Log</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent
      >
        <View style={styles.successOverlay}>
          <View style={styles.successModal}>
            <Text style={styles.successTitle}>✓ Logged Successfully</Text>
            <Text style={styles.successMessage}>Your adherence has been recorded and submitted for verification.</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                setSelectedPrescription(null);
                setMedicationPhoto(null);
                setSelfiePhoto(null);
                setNotes('');
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
  },
  prescriptionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  prescriptionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prescriptionInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  logButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'black',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cameraTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  camera: {
    flex: 1,
  },
  cameraFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    padding: 20,
    paddingBottom: 50,
  },
  cameraInstruction: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  captureButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff4444',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    margin: 20,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});