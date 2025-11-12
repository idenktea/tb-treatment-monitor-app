import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { WorkflowService } from '@/lib/workflows';

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
}

interface SymptomOption {
  id: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

const commonSymptoms: SymptomOption[] = [
  {
    id: 'nausea',
    name: 'Nausea/Vomiting',
    description: 'Feeling sick or vomiting',
    severity: 'moderate',
  },
  {
    id: 'rash',
    name: 'Skin Rash',
    description: 'Red, itchy, or painful skin',
    severity: 'moderate',
  },
  {
    id: 'fatigue',
    name: 'Fatigue',
    description: 'Unusual tiredness or weakness',
    severity: 'mild',
  },
  {
    id: 'headache',
    name: 'Headache',
    description: 'Persistent or severe headache',
    severity: 'moderate',
  },
  {
    id: 'dizziness',
    name: 'Dizziness',
    description: 'Feeling lightheaded or unsteady',
    severity: 'moderate',
  },
  {
    id: 'vision',
    name: 'Vision Changes',
    description: 'Blurred vision or yellowing of skin/eyes',
    severity: 'severe',
  },
  {
    id: 'breathing',
    name: 'Breathing Difficulty',
    description: 'Shortness of breath or wheezing',
    severity: 'severe',
  },
  {
    id: 'allergic',
    name: 'Allergic Reaction',
    description: 'Swelling, hives, or severe itching',
    severity: 'severe',
  },
];

export default function SymptomsScreen() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomOption[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('id, medication_name, dosage')
        .eq('status', 'active');

      if (error) throw error;
      setPrescriptions(data || []);
      if (data && data.length > 0) {
        setSelectedPrescription(data[0]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: SymptomOption) => {
    setSelectedSymptoms(prev => {
      const isSelected = prev.some(s => s.id === symptom.id);
      if (isSelected) {
        return prev.filter(s => s.id !== symptom.id);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const getSeverityColor = (sev: 'mild' | 'moderate' | 'severe') => {
    switch (sev) {
      case 'mild':
        return '#27ae60';
      case 'moderate':
        return '#f39c12';
      case 'severe':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getSeverityLabel = (sev: 'mild' | 'moderate' | 'severe') => {
    switch (sev) {
      case 'mild':
        return 'Mild - Monitor at home';
      case 'moderate':
        return 'Moderate - Contact healthcare provider';
      case 'severe':
        return 'Severe - Seek immediate medical attention';
      default:
        return '';
    }
  };

  const validateForm = () => {
    if (!selectedPrescription) {
      Alert.alert('Error', 'Please select a prescription');
      return false;
    }

    if (selectedSymptoms.length === 0 && !customSymptom.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return false;
    }

    return true;
  };

  const submitSymptomReport = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Get patient ID
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!patientData) {
        throw new Error('Patient profile not found');
      }

      // Combine symptom descriptions
      const symptomDescriptions = [
        ...selectedSymptoms.map(s => s.name),
        customSymptom.trim(),
      ].filter(Boolean).join(', ');

      // Create side effect record
      const { data: sideEffectData, error: sideEffectError } = await supabase
        .from('side_effects')
        .insert({
          patient_id: patientData.id,
          prescription_id: selectedPrescription.id,
          symptom_description: symptomDescriptions,
          severity,
          reported_at: new Date().toISOString(),
          notes: additionalNotes.trim() || null,
          triage_status: 'pending',
        })
        .select()
        .single();

      if (sideEffectError) throw sideEffectError;

      // Trigger workflow automation
      await WorkflowService.handleSideEffectReporting(sideEffectData.id);

      Alert.alert(
        'Symptom Report Submitted',
        `Your symptoms have been reported to your healthcare provider. ${
          severity === 'severe'
            ? 'Please seek immediate medical attention.'
            : severity === 'moderate'
            ? 'Your healthcare provider will contact you within 24 hours.'
            : 'Monitor your symptoms and contact your provider if they worsen.'
        }`,
        [{ text: 'OK', onPress: resetForm }]
      );
    } catch (error) {
      console.error('Error submitting symptom report:', error);
      Alert.alert('Error', 'Failed to submit symptom report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setCustomSymptom('');
    setSeverity('mild');
    setAdditionalNotes('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading prescriptions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Symptoms</Text>
          <Text style={styles.subtitle}>Tell us about any side effects you're experiencing</Text>
        </View>

        {/* Prescription Selection */}
        {prescriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Medication</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {prescriptions.map((prescription) => (
                <TouchableOpacity
                  key={prescription.id}
                  style={[
                    styles.prescriptionChip,
                    selectedPrescription?.id === prescription.id && styles.selectedChip,
                  ]}
                  onPress={() => setSelectedPrescription(prescription)}
                >
                  <Text
                    style={[
                      styles.prescriptionChipText,
                      selectedPrescription?.id === prescription.id && styles.selectedChipText,
                    ]}
                  >
                    {prescription.medication_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Common Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Side Effects</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>

          <View style={styles.symptomsGrid}>
            {commonSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.some(s => s.id === symptom.id);
              return (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomCard,
                    isSelected && styles.selectedSymptomCard,
                    symptom.severity === 'severe' && styles.severeSymptomCard,
                  ]}
                  onPress={() => toggleSymptom(symptom)}
                >
                  <View style={styles.symptomHeader}>
                    <Text style={[
                      styles.symptomName,
                      isSelected && styles.selectedSymptomText,
                    ]}>
                      {symptom.name}
                    </Text>
                    <View
                      style={[
                        styles.severityDot,
                        { backgroundColor: getSeverityColor(symptom.severity) },
                      ]}
                    />
                  </View>
                  <Text style={styles.symptomDescription}>
                    {symptom.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Symptom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Symptoms</Text>
          <TextInput
            style={styles.textInput}
            value={customSymptom}
            onChangeText={setCustomSymptom}
            placeholder="Describe any other symptoms..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Severity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How severe are your symptoms?</Text>

          {(['mild', 'moderate', 'severe'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityOption,
                severity === level && styles.selectedSeverity,
              ]}
              onPress={() => setSeverity(level)}
            >
              <View style={styles.severityOptionLeft}>
                <View
                  style={[
                    styles.severityRadio,
                    { backgroundColor: getSeverityColor(level) },
                    severity === level && styles.selectedRadio,
                  ]}
                >
                  {severity === level && (
                    <Text style={styles.radioDot}>✓</Text>
                  )}
                </View>
                <Text style={styles.severityLabel}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </View>
              <Text style={styles.severityDescription}>
                {getSeverityLabel(level)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.sectionSubtitle}>
            When did symptoms start? Anything that makes them better or worse?
          </Text>
          <TextInput
            style={styles.textInput}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Additional information..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitSymptomReport}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Symptom Report</Text>
          )}
        </TouchableOpacity>

        {/* Emergency Warning */}
        {severity === 'severe' && (
          <View style={styles.emergencyWarning}>
            <Text style={styles.emergencyTitle}>🚨 Emergency Warning</Text>
            <Text style={styles.emergencyText}>
              Based on your symptoms, please seek immediate medical attention.
              Call emergency services or go to the nearest emergency room.
            </Text>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  prescriptionChip: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#3498db',
  },
  prescriptionChipText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  symptomCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedSymptomCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  severeSymptomCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  symptomName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  selectedSymptomText: {
    color: '#3498db',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symptomDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  severityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedSeverity: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  severityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedRadio: {
    borderColor: '#3498db',
  },
  radioDot: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  severityDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    margin: 20,
    padding: 16,
    borderRadius: 12,
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
  emergencyWarning: {
    backgroundColor: '#fdf2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  footer: {
    height: 20,
  },
});