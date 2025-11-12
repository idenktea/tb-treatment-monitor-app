import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'medication_reminder' | 'stock_alert' | 'side_effect_alert' | 'appointment_reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export default function AlertsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle navigation based on notification type and data
    if (notification.data) {
      switch (notification.data.event) {
        case 'adherence_submitted':
          // Navigate to adherence review screen
          break;
        case 'medication_dispensed':
          // Navigate to medications screen
          break;
        case 'side_effect_reported':
          // Navigate to patient details/screening
          break;
        case 'stock_low':
          // Navigate to inventory screen
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'medication_reminder':
        return '💊';
      case 'stock_alert':
        return '📦';
      case 'side_effect_alert':
        return '⚠️';
      case 'appointment_reminder':
        return '📅';
      case 'system':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'medication_reminder':
        return '#3498db';
      case 'stock_alert':
        return '#f39c12';
      case 'side_effect_alert':
        return '#e74c3c';
      case 'appointment_reminder':
        return '#9b59b6';
      case 'system':
        return '#95a5a6';
      default:
        return '#34495e';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'unread', 'read'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterType && styles.filterTabTextActive,
              ]}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      {unreadCount > 0 && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllReadButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' :
               'No notifications'}
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadNotificationCard,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationLeft}>
                  <Text style={[styles.notificationIcon, { color: getNotificationColor(notification.type) }]}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                  <View style={styles.notificationContent}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.read && styles.unreadNotificationTitle,
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </View>
                <View style={styles.notificationRight}>
                  {!notification.read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
              </View>

              <View style={styles.notificationActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
                {!notification.read && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.markReadButton]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.markReadButtonText]}>
                      Mark Read
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#3498db',
  },
  filterTabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  markAllReadButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markAllReadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadNotificationCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  unreadNotificationTitle: {
    color: '#2c3e50',
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  notificationRight: {
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ecf0f1',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  markReadButton: {
    backgroundColor: '#3498db',
  },
  markReadButtonText: {
    color: 'white',
  },
});