import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification categories for different types of notifications
export const NOTIFICATION_CATEGORIES = {
  MEDICATION_REMINDER: {
    identifier: 'medication_reminder',
    actions: [
      {
        identifier: 'TAKE_MEDICATION',
        title: 'Take Now',
        options: { foreground: true },
      },
      {
        identifier: 'SNOOZE',
        title: 'Snooze',
        options: { foreground: true },
      },
    ],
  },
  ADHERENCE_REVIEW: {
    identifier: 'adherence_review',
    actions: [
      {
        identifier: 'REVIEW_NOW',
        title: 'Review Now',
        options: { foreground: true },
      },
      {
        identifier: 'LATER',
        title: 'Review Later',
        options: { foreground: true },
      },
    ],
  },
  STOCK_ALERT: {
    identifier: 'stock_alert',
    actions: [
      {
        identifier: 'VIEW_STOCK',
        title: 'View Stock',
        options: { foreground: true },
      },
      {
        identifier: 'ORDER_NOW',
        title: 'Order Now',
        options: { foreground: true },
      },
    ],
  },
  SIDE_EFFECT_ALERT: {
    identifier: 'side_effect_alert',
    actions: [
      {
        identifier: 'VIEW_DETAILS',
        title: 'View Details',
        options: { foreground: true },
      },
      {
        identifier: 'CONTACT_PATIENT',
        title: 'Contact Patient',
        options: { foreground: true },
      },
    ],
  },
} as const;

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get notification permissions');
      return false;
    }

    // Set up notification categories
    await setupNotificationCategories();
    return true;
  }

  return true; // Android permissions are handled via app.json
};

// Setup notification categories
export const setupNotificationCategories = async () => {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync(
      NOTIFICATION_CATEGORIES.MEDICATION_REMINDER.identifier,
      NOTIFICATION_CATEGORIES.MEDICATION_REMINDER.actions
    );

    await Notifications.setNotificationCategoryAsync(
      NOTIFICATION_CATEGORIES.ADHERENCE_REVIEW.identifier,
      NOTIFICATION_CATEGORIES.ADHERENCE_REVIEW.actions
    );

    await Notifications.setNotificationCategoryAsync(
      NOTIFICATION_CATEGORIES.STOCK_ALERT.identifier,
      NOTIFICATION_CATEGORIES.STOCK_ALERT.actions
    );

    await Notifications.setNotificationCategoryAsync(
      NOTIFICATION_CATEGORIES.SIDE_EFFECT_ALERT.identifier,
      NOTIFICATION_CATEGORIES.SIDE_EFFECT_ALERT.actions
    );
  }
};

// Schedule medication reminder notification
export const scheduleMedicationReminder = async (
  userId: string,
  prescriptionId: string,
  medicationName: string,
  dosage: string,
  scheduledTime: Date,
  repeat: 'daily' | 'weekly' | 'never' = 'daily'
) => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${medicationName} (${dosage})`,
        data: {
          type: 'medication_reminder',
          userId,
          prescriptionId,
          medicationName,
          dosage,
        },
        categoryIdentifier: NOTIFICATION_CATEGORIES.MEDICATION_REMINDER.identifier,
        sound: 'default',
      },
      trigger: {
        date: scheduledTime,
        repeats: repeat !== 'never',
        // For daily repeat, we'll need to schedule multiple notifications or use a different approach
      },
    });

    console.log(`Medication reminder scheduled with identifier: ${identifier}`);
    return identifier;
  } catch (error) {
    console.error('Error scheduling medication reminder:', error);
    throw error;
  }
};

// Send immediate adherence review notification to PMO
export const sendAdherenceReviewNotification = async (
  pmoId: string,
  patientName: string,
  medicationName: string
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Adherence Submission',
        body: `${patientName} has submitted adherence proof for ${medicationName}`,
        data: {
          type: 'adherence_review',
          patientName,
          medicationName,
        },
        categoryIdentifier: NOTIFICATION_CATEGORIES.ADHERENCE_REVIEW.identifier,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error sending adherence review notification:', error);
    throw error;
  }
};

// Send stock alert notification to pharmacists
export const sendStockAlertNotification = async (
  pharmacistId: string,
  medicationName: string,
  currentStock: number,
  minimumStock: number
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low Stock Alert',
        body: `${medicationName} is running low (${currentStock} remaining, minimum: ${minimumStock})`,
        data: {
          type: 'stock_alert',
          medicationName,
          currentStock,
          minimumStock,
        },
        categoryIdentifier: NOTIFICATION_CATEGORIES.STOCK_ALERT.identifier,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending stock alert notification:', error);
    throw error;
  }
};

// Send side effect alert notification
export const sendSideEffectAlertNotification = async (
  doctorId: string,
  pmoId: string,
  patientName: string,
  severity: 'mild' | 'moderate' | 'severe',
  symptoms: string
) => {
  try {
    const priority = severity === 'severe'
      ? Notifications.AndroidNotificationPriority.MAX
      : severity === 'moderate'
      ? Notifications.AndroidNotificationPriority.HIGH
      : Notifications.AndroidNotificationPriority.DEFAULT;

    const title = severity === 'severe'
      ? '🚨 Severe Side Effect Alert'
      : severity === 'moderate'
      ? '⚠️ Side Effect Alert'
      : 'ℹ️ Side Effect Reported';

    // Notify doctor
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: `${patientName} reports ${severity} side effects: ${symptoms}`,
        data: {
          type: 'side_effect_alert',
          patientName,
          severity,
          symptoms,
        },
        categoryIdentifier: NOTIFICATION_CATEGORIES.SIDE_EFFECT_ALERT.identifier,
        sound: 'default',
        priority,
      },
      trigger: null,
    });

    // Notify PMO if different from doctor
    if (pmoId !== doctorId) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: `${patientName} reports ${severity} side effects: ${symptoms}`,
          data: {
            type: 'side_effect_alert',
            patientName,
            severity,
            symptoms,
          },
          categoryIdentifier: NOTIFICATION_CATEGORIES.SIDE_EFFECT_ALERT.identifier,
          sound: 'default',
          priority,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error sending side effect alert notification:', error);
    throw error;
  }
};

// Cancel scheduled notification
export const cancelNotification = async (identifier: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
    throw error;
  }
};

// Cancel all notifications for a user
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    throw error;
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Notification response handler
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  const { notification, actionIdentifier } = response;
  const data = notification.request.content.data;

  console.log('Notification response:', { actionIdentifier, data });

  switch (actionIdentifier) {
    case 'TAKE_MEDICATION':
      // Navigate to adherence logging screen
      break;
    case 'REVIEW_NOW':
      // Navigate to adherence review screen
      break;
    case 'VIEW_STOCK':
      // Navigate to inventory screen
      break;
    case 'ORDER_NOW':
      // Navigate to order screen
      break;
    case 'VIEW_DETAILS':
      // Navigate to side effect details screen
      break;
    case 'CONTACT_PATIENT':
      // Open communication interface
      break;
    default:
      // Handle default notification tap
      break;
  }
};

// Setup notification response listener
export const setupNotificationResponseListener = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  return subscription;
};