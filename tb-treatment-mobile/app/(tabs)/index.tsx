import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Admin Dashboard</Text>
            <Text style={styles.subtitleText}>System Overview</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>247</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>89</Text>
                <Text style={styles.statLabel}>Active Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Pending Tasks</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Manage Users</Text>
                <Text style={styles.actionSubtitle}>Add, edit, or remove users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>System Settings</Text>
                <Text style={styles.actionSubtitle}>Configure application settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'nurse':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Nurse Dashboard</Text>
            <Text style={styles.subtitleText}>Patient Management</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>34</Text>
                <Text style={styles.statLabel}>My Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>New Registrations</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Follow-ups Due</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Register New Patient</Text>
                <Text style={styles.actionSubtitle}>TB.01 Form Registration</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Drug Requests</Text>
                <Text style={styles.actionSubtitle}>Request medications</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'doctor':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Doctor Dashboard</Text>
            <Text style={styles.subtitleText}>Medical Overview</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>56</Text>
                <Text style={styles.statLabel}>Active Cases</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Prescriptions Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Side Effects Review</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Create Prescription</Text>
                <Text style={styles.actionSubtitle}>Digital prescribing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Treatment Validation</Text>
                <Text style={styles.actionSubtitle}>Review treatment plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'pharmacist':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Pharmacist Dashboard</Text>
            <Text style={styles.subtitleText}>Inventory Management</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>89%</Text>
                <Text style={styles.statLabel}>Stock Adequacy</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>7</Text>
                <Text style={styles.statLabel}>Low Stock Alerts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>15</Text>
                <Text style={styles.statLabel}>Dispensing Pending</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Update Inventory</Text>
                <Text style={styles.actionSubtitle}>Adjust stock levels</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Process Dispensing</Text>
                <Text style={styles.actionSubtitle}>Review and dispense</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'patient':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Patient Dashboard</Text>
            <Text style={styles.subtitleText}>Your Treatment Journey</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>85%</Text>
                <Text style={styles.statLabel}>Adherence Rate</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>Days Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>15</Text>
                <Text style={styles.statLabel}>Days Remaining</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Log Medication Intake</Text>
                <Text style={styles.actionSubtitle}>Take photo + selfie proof</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Report Symptoms</Text>
                <Text style={styles.actionSubtitle}>Any side effects?</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'pmo':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>PMO Dashboard</Text>
            <Text style={styles.subtitleText}>Treatment Supervision</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>67</Text>
                <Text style={styles.statLabel}>Monitored Patients</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Adherence to Review</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>Side Effects Alert</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Verify Adherence</Text>
                <Text style={styles.actionSubtitle}>Review photo submissions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Text style={styles.actionTitle}>Monitor Patients</Text>
                <Text style={styles.actionSubtitle}>Track treatment progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.roleContent}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subtitleText}>Your dashboard is being prepared...</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.first_name || 'User'}</Text>
          <Text style={styles.roleText}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User'}
          </Text>
        </View>

        {renderRoleSpecificContent()}
      </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  roleText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 4,
  },
  roleContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});
