import { supabase } from './supabase';
import {
  sendAdherenceReviewNotification,
  sendStockAlertNotification,
  sendSideEffectAlertNotification,
  scheduleMedicationReminder
} from './notifications';

// Workflow types
export type WorkflowEvent =
  | 'patient_registered'
  | 'prescription_created'
  | 'adherence_submitted'
  | 'adherence_verified'
  | 'medication_dispensed'
  | 'stock_low'
  | 'side_effect_reported'
  | 'treatment_completed';

// Workflow automation service
export class WorkflowService {

  // Handle patient registration workflow
  static async handlePatientRegistration(patientId: string) {
    try {
      // 1. Get patient details
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          *,
          assigned_nurse_id,
          assigned_doctor_id,
          assigned_pmo_id,
          users!patients_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;

      // 2. Create notifications for assigned healthcare workers
      const notifications = [
        {
          user_id: patient.assigned_nurse_id,
          type: 'system' as const,
          title: 'New Patient Registered',
          message: `${patient.users.first_name} ${patient.users.last_name} has been registered under your care.`,
          data: { patientId, event: 'patient_registered' },
        },
        {
          user_id: patient.assigned_doctor_id,
          type: 'system' as const,
          title: 'New Patient Assigned',
          message: `New patient assigned: ${patient.users.first_name} ${patient.users.last_name}`,
          data: { patientId, event: 'patient_registered' },
        },
        {
          user_id: patient.assigned_pmo_id,
          type: 'system' as const,
          title: 'New Patient for Monitoring',
          message: `New patient assigned for treatment monitoring: ${patient.users.first_name} ${patient.users.last_name}`,
          data: { patientId, event: 'patient_registered' },
        },
      ];

      await supabase.from('notifications').insert(notifications);

      // 3. Update patient status to active
      await supabase
        .from('patients')
        .update({ registration_status: 'active' })
        .eq('id', patientId);

      return { success: true, message: 'Patient registration workflow completed' };
    } catch (error) {
      console.error('Error in patient registration workflow:', error);
      throw error;
    }
  }

  // Handle prescription creation workflow
  static async handlePrescriptionCreation(prescriptionId: string) {
    try {
      // 1. Get prescription details
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients!inner (
            user_id,
            assigned_nurse_id,
            assigned_pmo_id,
            users!patients_user_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', prescriptionId)
        .single();

      if (prescriptionError) throw prescriptionError;

      // 2. Notify pharmacist about new prescription
      // Get available pharmacists
      const { data: pharmacists } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'pharmacist')
        .limit(1);

      if (pharmacists && pharmacists.length > 0) {
        await supabase.from('notifications').insert({
          user_id: pharmacists[0].id,
          type: 'system',
          title: 'New Prescription to Dispense',
          message: `New prescription for ${prescription.medication_name} - ${prescription.patients.users.first_name} ${prescription.patients.users.last_name}`,
          data: { prescriptionId, event: 'prescription_created' },
        });
      }

      // 3. Schedule medication reminders for patient
      const startDate = new Date(prescription.start_date);
      const endDate = new Date(prescription.end_date);

      // Calculate reminder times based on frequency
      const reminderTimes = this.calculateReminderTimes(prescription.frequency, startDate);

      for (const reminderTime of reminderTimes) {
        if (reminderTime <= endDate) {
          try {
            await scheduleMedicationReminder(
              prescription.patients.user_id,
              prescription.id,
              prescription.medication_name,
              prescription.dosage,
              reminderTime,
              'daily'
            );
          } catch (error) {
            console.error('Error scheduling medication reminder:', error);
          }
        }
      }

      return { success: true, message: 'Prescription workflow completed' };
    } catch (error) {
      console.error('Error in prescription creation workflow:', error);
      throw error;
    }
  }

  // Handle adherence submission workflow
  static async handleAdherenceSubmission(adherenceLogId: string) {
    try {
      // 1. Get adherence log details
      const { data: adherenceLog, error: logError } = await supabase
        .from('adherence_logs')
        .select(`
          *,
          patients!inner (
            user_id,
            assigned_pmo_id,
            users!patients_user_id_fkey (
              first_name,
              last_name
            )
          ),
          prescriptions!inner (
            medication_name
          )
        `)
        .eq('id', adherenceLogId)
        .single();

      if (logError) throw logError;

      // 2. Send immediate notification to PMO
      await sendAdherenceReviewNotification(
        adherenceLog.patients.assigned_pmo_id,
        `${adherenceLog.patients.users.first_name} ${adherenceLog.patients.users.last_name}`,
        adherenceLog.prescriptions.medication_name
      );

      // 3. Create in-app notification record
      await supabase.from('notifications').insert({
        user_id: adherenceLog.patients.assigned_pmo_id,
        type: 'medication_reminder',
        title: 'New Adherence Submission',
        message: `Patient has submitted adherence proof for ${adherenceLog.prescriptions.medication_name}`,
        data: {
          adherenceLogId,
          prescriptionId: adherenceLog.prescription_id,
          patientId: adherenceLog.patient_id,
          event: 'adherence_submitted'
        },
      });

      return { success: true, message: 'Adherence submission workflow completed' };
    } catch (error) {
      console.error('Error in adherence submission workflow:', error);
      throw error;
    }
  }

  // Handle medication dispensing workflow
  static async handleMedicationDispensing(dispensingRecordId: string) {
    try {
      // 1. Get dispensing record details
      const { data: dispensing, error: dispensingError } = await supabase
        .from('dispensing_records')
        .select(`
          *,
          patients!inner (
            user_id,
            users!patients_user_id_fkey (
              first_name,
              last_name
            )
          ),
          prescriptions!inner (
            medication_name,
            dosage
          )
        `)
        .eq('id', dispensingRecordId)
        .single();

      if (dispensingError) throw dispensingError;

      // 2. Notify patient about medication availability
      await supabase.from('notifications').insert({
        user_id: dispensing.patients.user_id,
        type: 'system',
        title: 'Medication Ready for Pickup',
        message: `Your ${dispensing.prescriptions.medication_name} (${dispensing.prescriptions.dosage}) is ready for pickup.`,
        data: {
          dispensingRecordId,
          medicationName: dispensing.prescriptions.medication_name,
          event: 'medication_dispensed'
        },
      });

      // 3. Check inventory levels and alert if low
      await this.checkInventoryLevels(dispensing.medication_name);

      return { success: true, message: 'Medication dispensing workflow completed' };
    } catch (error) {
      console.error('Error in medication dispensing workflow:', error);
      throw error;
    }
  }

  // Handle side effect reporting workflow
  static async handleSideEffectReporting(sideEffectId: string) {
    try {
      // 1. Get side effect details
      const { data: sideEffect, error: sideEffectError } = await supabase
        .from('side_effects')
        .select(`
          *,
          patients!inner (
            user_id,
            assigned_doctor_id,
            assigned_pmo_id,
            users!patients_user_id_fkey (
              first_name,
              last_name
            )
          ),
          prescriptions!inner (
            medication_name
          )
        `)
        .eq('id', sideEffectId)
        .single();

      if (sideEffectError) throw sideEffectError;

      // 2. Triage based on severity
      const triageResult = this.triageSideEffect(sideEffect.severity, sideEffect.symptom_description);

      // 3. Update triage status
      await supabase
        .from('side_effects')
        .update({
          triage_status: triageResult.status === 'escalated' ? 'escalated' : 'pending'
        })
        .eq('id', sideEffectId);

      // 4. Send notifications to healthcare providers
      if (triageResult.notifyDoctor) {
        await sendSideEffectAlertNotification(
          sideEffect.patients.assigned_doctor_id,
          sideEffect.patients.assigned_pmo_id,
          `${sideEffect.patients.users.first_name} ${sideEffect.patients.users.last_name}`,
          sideEffect.severity,
          sideEffect.symptom_description
        );
      }

      // 5. Create in-app notifications
      const notifications = [
        {
          user_id: sideEffect.patients.assigned_doctor_id,
          type: 'side_effect_alert' as const,
          title: `Side Effect Reported - ${sideEffect.severity}`,
          message: `${sideEffect.patients.users.first_name} ${sideEffect.patients.users.last_name} reports: ${sideEffect.symptom_description}`,
          data: {
            sideEffectId,
            patientId: sideEffect.patient_id,
            severity: sideEffect.severity,
            event: 'side_effect_reported'
          },
        },
      ];

      if (sideEffect.patients.assigned_pmo_id !== sideEffect.patients.assigned_doctor_id) {
        notifications.push({
          user_id: sideEffect.patients.assigned_pmo_id,
          type: 'side_effect_alert' as const,
          title: `Side Effect Reported - ${sideEffect.severity}`,
          message: `${sideEffect.patients.users.first_name} ${sideEffect.patients.users.last_name} reports: ${sideEffect.symptom_description}`,
          data: {
            sideEffectId,
            patientId: sideEffect.patient_id,
            severity: sideEffect.severity,
            event: 'side_effect_reported'
          },
        });
      }

      await supabase.from('notifications').insert(notifications);

      return { success: true, message: 'Side effect reporting workflow completed', triage: triageResult };
    } catch (error) {
      console.error('Error in side effect reporting workflow:', error);
      throw error;
    }
  }

  // Check inventory levels and send alerts if needed
  static async checkInventoryLevels(medicationName: string) {
    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('medication_name', medicationName)
        .single();

      if (inventoryError || !inventory) return;

      if (inventory.current_stock <= inventory.minimum_stock_level) {
        // Get pharmacists to notify
        const { data: pharmacists } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'pharmacist');

        if (pharmacists) {
          const notifications = pharmacists.map(pharmacist => ({
            user_id: pharmacist.id,
            type: 'stock_alert' as const,
            title: 'Low Stock Alert',
            message: `${medicationName} is running low (${inventory.current_stock} remaining)`,
            data: {
              inventoryId: inventory.id,
              medicationName,
              currentStock: inventory.current_stock,
              minimumStock: inventory.minimum_stock_level,
              event: 'stock_low'
            },
          }));

          await supabase.from('notifications').insert(notifications);

          // Send push notifications
          for (const pharmacist of pharmacists) {
            await sendStockAlertNotification(
              pharmacist.id,
              medicationName,
              inventory.current_stock,
              inventory.minimum_stock_level
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
  }

  // Triage side effects based on severity and symptoms
  private static triageSideEffect(severity: 'mild' | 'moderate' | 'severe', symptoms: string) {
    const severeKeywords = [
      'difficulty breathing', 'chest pain', 'severe rash', 'swelling',
      'anaphylaxis', 'seizure', 'unconscious', 'blurred vision',
      'yellow skin', 'dark urine', 'severe headache'
    ];

    const moderateKeywords = [
      'nausea', 'vomiting', 'diarrhea', 'dizziness', 'fatigue',
      'rash', 'headache', 'insomnia', 'loss of appetite'
    ];

    const lowerSymptoms = symptoms.toLowerCase();

    // Check for severe symptoms regardless of reported severity
    const hasSevereSymptoms = severeKeywords.some(keyword => lowerSymptoms.includes(keyword));

    if (severity === 'severe' || hasSevereSymptoms) {
      return {
        status: 'escalated' as const,
        notifyDoctor: true,
        notifyPMO: true,
        urgency: 'immediate',
        message: 'Immediate medical attention required'
      };
    }

    if (severity === 'moderate') {
      return {
        status: 'pending' as const,
        notifyDoctor: true,
        notifyPMO: false,
        urgency: 'within 24 hours',
        message: 'Medical review recommended within 24 hours'
      };
    }

    return {
      status: 'pending' as const,
      notifyDoctor: false,
      notifyPMO: false,
      urgency: 'routine',
      message: 'Monitor symptoms, contact if worsens'
    };
  }

  // Calculate reminder times based on frequency
  private static calculateReminderTimes(frequency: string, startDate: Date): Date[] {
    const times: Date[] = [];
    const baseTime = new Date(startDate);
    baseTime.setHours(9, 0, 0, 0); // Default to 9 AM

    switch (frequency.toLowerCase()) {
      case 'once daily':
        times.push(new Date(baseTime));
        break;
      case 'twice daily':
      case 'bid':
        times.push(new Date(baseTime));
        const eveningTime = new Date(baseTime);
        eveningTime.setHours(18, 0, 0, 0); // 6 PM
        times.push(eveningTime);
        break;
      case 'three times daily':
      case 'tid':
        times.push(new Date(baseTime));
        const afternoonTime = new Date(baseTime);
        afternoonTime.setHours(14, 0, 0, 0); // 2 PM
        times.push(afternoonTime);
        const eveningTime = new Date(baseTime);
        eveningTime.setHours(20, 0, 0, 0); // 8 PM
        times.push(eveningTime);
        break;
      case 'four times daily':
      case 'qid':
        times.push(new Date(baseTime));
        const lateMorningTime = new Date(baseTime);
        lateMorningTime.setHours(12, 0, 0, 0); // 12 PM
        times.push(lateMorningTime);
        const afternoonTime = new Date(baseTime);
        afternoonTime.setHours(16, 0, 0, 0); // 4 PM
        times.push(afternoonTime);
        const eveningTime = new Date(baseTime);
        eveningTime.setHours(20, 0, 0, 0); // 8 PM
        times.push(eveningTime);
        break;
      default:
        times.push(new Date(baseTime));
    }

    return times;
  }

  // Handle treatment completion workflow
  static async handleTreatmentCompletion(patientId: string) {
    try {
      // 1. Update patient status
      await supabase
        .from('patients')
        .update({ registration_status: 'completed' })
        .eq('id', patientId);

      // 2. Get patient details
      const { data: patient } = await supabase
        .from('patients')
        .select(`
          user_id,
          assigned_doctor_id,
          assigned_nurse_id,
          assigned_pmo_id
        `)
        .eq('id', patientId)
        .single();

      if (!patient) return;

      // 3. Cancel all scheduled medication reminders
      // This would need to be implemented based on the notification storage system

      // 4. Send completion notifications
      const notifications = [
        {
          user_id: patient.user_id,
          type: 'system' as const,
          title: 'Treatment Completed! 🎉',
          message: 'Congratulations! You have successfully completed your TB treatment.',
          data: { patientId, event: 'treatment_completed' },
        },
        {
          user_id: patient.assigned_doctor_id,
          type: 'system' as const,
          title: 'Patient Treatment Completed',
          message: `Patient has completed TB treatment.`,
          data: { patientId, event: 'treatment_completed' },
        },
        {
          user_id: patient.assigned_nurse_id,
          type: 'system' as const,
          title: 'Patient Treatment Completed',
          message: `Patient has completed TB treatment.`,
          data: { patientId, event: 'treatment_completed' },
        },
        {
          user_id: patient.assigned_pmo_id,
          type: 'system' as const,
          title: 'Patient Treatment Completed',
          message: `Patient has completed TB treatment.`,
          data: { patientId, event: 'treatment_completed' },
        },
      ];

      await supabase.from('notifications').insert(notifications);

      return { success: true, message: 'Treatment completion workflow completed' };
    } catch (error) {
      console.error('Error in treatment completion workflow:', error);
      throw error;
    }
  }
}