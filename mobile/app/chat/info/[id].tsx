import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, StatusBar, Platform, Alert, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Shadows } from '../../../constants/Colors';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { ArrowLeft, MoreVertical, LogOut, Users, UserPlus, Bell, Image as ImageIcon, Search, Shield, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchChatInfo, currentChatInfo, isLoading, leaveGroup, removeMember } = useChatStore();
  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
    if (id) fetchChatInfo(id as string);
  }, [id]);

  if (isLoading && !currentChatInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading group info...</Text>
      </View>
    );
  }

  const info = currentChatInfo;
  if (!info) return null;

  const members = info.members || [];
  const avatarUri = info.avatar_url || `https://i.pravatar.cc/150?u=group-${info.id}`;
  const currentMember = members.find((m: any) => m.id === currentUser?.id);
  const isAdmin = currentMember?.role === 'admin';

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${info.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(id as string);
              router.replace('/(tabs)');
            } catch (err) {
              Alert.alert('Error', 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = (member: any) => {
    if (!isAdmin) return;
    if (member.id === currentUser?.id) return;

    Alert.alert(
      'Remove Member',
      `Remove ${member.username} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(id as string, member.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handleAddMembers = () => {
    router.push({
      pathname: '/chat/add-members',
      params: {
        chatId: id as string,
        existingMemberIds: members.map((m: any) => m.id).join(','),
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView bounces showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Hero Header */}
        <View style={styles.header}>
          <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} blurRadius={25} />
          <LinearGradient
            colors={['rgba(79, 70, 229, 0.7)', 'rgba(15, 23, 42, 0.85)'] as any}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
              <ArrowLeft color="#FFF" size={22} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <MoreVertical color="#FFF" size={22} />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.headerContent}>
            <View style={styles.mainAvatarWrap}>
              <Image source={{ uri: avatarUri }} style={styles.mainAvatar} />
            </View>
            <Text style={styles.groupName}>{info.name}</Text>
            <View style={styles.metaRow}>
              <Users color="rgba(255,255,255,0.7)" size={14} />
              <Text style={styles.groupMeta}>{members.length} Participants</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.12)', 'rgba(99, 102, 241, 0.06)'] as any}
              style={styles.actionIconWrap}
            >
              <Bell color={Colors.primary} size={22} />
            </LinearGradient>
            <Text style={styles.actionText}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleAddMembers}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.06)'] as any}
              style={styles.actionIconWrap}
            >
              <UserPlus color="#10B981" size={22} />
            </LinearGradient>
            <Text style={styles.actionText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <LinearGradient
              colors={['rgba(244, 63, 94, 0.12)', 'rgba(244, 63, 94, 0.06)'] as any}
              style={styles.actionIconWrap}
            >
              <Search color="#F43F5E" size={22} />
            </LinearGradient>
            <Text style={styles.actionText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.descCard}>
            <Text style={styles.descriptionText}>
              {info.description || 'No description set for this group.'}
            </Text>
            <View style={styles.createdRow}>
              <Text style={styles.createdAtText}>
                Created {new Date(info.created_at).toLocaleDateString('en-US', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Media Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Media & Links</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
            {[1, 2, 3, 4].map(i => (
              <LinearGradient
                key={i}
                colors={['#F1F5F9', '#E2E8F0'] as any}
                style={styles.mediaItem}
              >
                <ImageIcon color="#94A3B8" size={24} />
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{members.length} Participants</Text>
            {isAdmin && (
              <TouchableOpacity onPress={handleAddMembers}>
                <Text style={styles.addMemberBtn}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {members.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={styles.memberRow}
              onLongPress={() => handleRemoveMember(member)}
              activeOpacity={0.7}
              disabled={!isAdmin || member.id === currentUser?.id}
            >
              <View style={styles.memberAvatarWrap}>
                <Image
                  source={{ uri: member.avatar_url || `https://i.pravatar.cc/150?u=${member.id}` }}
                  style={styles.memberAvatar}
                />
                {member.is_online && <View style={styles.memberOnline} />}
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.memberName}>
                    {member.username}
                    {member.id === currentUser?.id ? ' (You)' : ''}
                  </Text>
                </View>
                <Text style={styles.memberBio} numberOfLines={1}>
                  {member.bio || 'Available'}
                </Text>
              </View>
              {member.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Crown color={Colors.primary} size={12} />
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleLeaveGroup}>
            <View style={styles.dangerIconWrap}>
              <LogOut color="#EF4444" size={20} />
            </View>
            <Text style={styles.dangerText}>Exit Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Header
  header: {
    height: 340,
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    alignItems: 'center',
  },
  mainAvatarWrap: {
    borderRadius: 56,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 14,
  },
  mainAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  groupName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  groupMeta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 36,
    paddingVertical: 24,
    backgroundColor: '#FFF',
    borderBottomWidth: 8,
    borderBottomColor: '#F1F5F9',
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Section
  section: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  addMemberBtn: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '800',
  },

  // Description
  descCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  createdRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  createdAtText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Media
  mediaRow: {
    gap: 10,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 4,
  },
  memberAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  memberOnline: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FAFBFC',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberBio: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  adminText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Danger
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  dangerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
});
