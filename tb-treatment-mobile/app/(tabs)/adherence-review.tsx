import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AdherenceLog {
  id: string;
  patient_id: string;
  patient_name: string;
  prescription_id: string;
  medication_name: string;
  adherence_date: string;
  taken_at: string;
  photo_url: string;
  selfie_url: string;
  verified_by_pmo: boolean;
  notes: string | null;
  created_at: string;
}

export default function AdherenceReviewScreen() {
  const { user } = useAuth();
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdherenceLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchAdherenceLogs();
  }, []);

  const fetchAdherenceLogs = async () => {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('adherence_logs')
        .select(`
          *,
          patients!inner(
            user_id,
            users!inner(
              first_name,
              last_name
            )
          ),
          prescriptions!inner(
            medication_name
          )
        `)
        .eq('patients.assigned_pmo_id', user?.id)
        .eq('verified_by_pmo', false)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const formattedLogs = logs?.map(log => ({
        ...log,
        patient_name: `${log.patients.users.first_name} ${log.patients.users.last_name}`,
        medication_name: log.prescriptions.medication_name,
      })) || [];

      setAdherenceLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching adherence logs:', error);
      Alert.alert('Error', 'Failed to load adherence logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdherenceLogs();
  };

  const verifyAdherence = async (logId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('adherence_logs')
        .update({
          verified_by_pmo: true,
          pmo_id: user?.id,
        })
        .eq('id', logId);

      if (error) throw error;

      // Create notification for patient
      const log = adherenceLogs.find(l => l.id === logId);
      if (log) {
        await supabase
          .from('notifications')
          .insert({
            user_id: log.patient_id,
            type: 'system',
            title: approved ? 'Adherence Verified' : 'Adherence Review Required',
            message: approved
              ? 'Your medication adherence has been verified.'
              : 'Please contact your healthcare provider about your medication adherence.',
          });
      }

      Alert.alert(
        'Success',
        approved ? 'Adherence verified successfully' : 'Review note added successfully'
      );

      setAdherenceLogs(prev => prev.filter(log => log.id !== logId));
      setShowDetailModal(false);
      setSelectedLog(null);
    } catch (error) {
      console.error('Error verifying adherence:', error);
      Alert.alert('Error', 'Failed to verify adherence');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (verified: boolean) => {
    return verified ? '#27ae60' : '#f39c12';
  };

  const getStatusText = (verified: boolean) => {
    return verified ? 'Verified' : 'Pending Review';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading adherence logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Adherence Review</Text>
        <Text style={styles.subtitle}>Verify patient medication adherence</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {adherenceLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No pending adherence reviews</Text>
            <Text style={styles.emptyStateSubtext}>
              All submitted adherence logs have been reviewed
            </Text>
          </View>
        ) : (
          adherenceLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logInfo}>
                  <Text style={styles.patientName}>{log.patient_name}</Text>
                  <Text style={styles.medicationName}>{log.medication_name}</Text>
                  <Text style={styles.adherenceDate}>
                    Submitted: {formatDate(log.created_at)}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, { color: getStatusColor(log.verified_by_pmo) }]}>
                    {getStatusText(log.verified_by_pmo)}
                  </Text>
                </View>
              </View>

              <View style={styles.photoPreview}>
                <View style={styles.photoContainer}>
                  <Image source={{ uri: log.photo_url }} style={styles.thumbnailImage} />
                  <Text style={styles.photoLabel}>Medication</Text>
                </View>
                <View style={styles.photoContainer}>
                  <Image source={{ uri: log.selfie_url }} style={styles.thumbnailImage} />
                  <Text style={styles.photoLabel}>Selfie</Text>
                </View>
              </View>

              {log.notes && (
                <Text style={styles.notesText} numberOfLines={2}>
                  Notes: {log.notes}
                </Text>
              )}

              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  setSelectedLog(log);
                  setShowDetailModal(true);
                }}
              >
                <Text style={styles.reviewButtonText}>Review Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Adherence Review</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Patient Information</Text>
                <Text style={styles.detailText}>Name: {selectedLog.patient_name}</Text>
                <Text style={styles.detailText}>Medication: {selectedLog.medication_name}</Text>
                <Text style={styles.detailText}>
                  Submitted: {formatDate(selectedLog.created_at)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Photos</Text>
                <View style={styles.detailPhotoSection}>
                  <View style={styles.detailPhotoContainer}>
                    <Image source={{ uri: selectedLog.photo_url }} style={styles.detailImage} />
                    <Text style={styles.photoLabel}>Medication Photo</Text>
                  </View>
                  <View style={styles.detailPhotoContainer}>
                    <Image source={{ uri: selectedLog.selfie_url }} style={styles.detailImage} />
                    <Text style={styles.photoLabel}>Selfie Verification</Text>
                  </View>
                </View>
              </View>

              {selectedLog.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Patient Notes</Text>
                  <Text style={styles.notesDetailText}>{selectedLog.notes}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => verifyAdherence(selectedLog.id, false)}
                >
                  <Text style={styles.rejectButtonText}>Flag for Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => verifyAdherence(selectedLog.id, true)}
                >
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    color: '#3498db',
    marginBottom: 4,
  },
  adherenceDate: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
    flex: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  notesText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  detailPhotoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailPhotoContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  notesDetailText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});