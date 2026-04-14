import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Image, ActivityIndicator, Alert, Animated, Pressable, StatusBar } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { LogOut, ChevronRight, Moon, Bell, Lock, Globe, HelpCircle, Camera, User, Shield, Palette, MessageCircle, Star, Heart } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../utils/upload';
import axios from 'axios';
import { Config } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

const SETTINGS_SECTIONS = [
  {
    title: 'General',
    items: [
      { id: '1', title: 'Appearance', subtitle: 'Dark mode, theme', icon: Palette, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
      { id: '2', title: 'Notifications', subtitle: 'Push, sounds, badges', icon: Bell, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
      { id: '3', title: 'Language', subtitle: 'English (US)', icon: Globe, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { id: '4', title: 'Privacy & Security', subtitle: 'Blocked, visibility', icon: Shield, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
      { id: '5', title: 'Help & Support', subtitle: 'FAQ, contact us', icon: HelpCircle, color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    ],
  },
];

// ─── Stat Pill ───
const StatPill = ({ value, label, icon }: { value: string, label: string, icon: React.ReactNode }) => (
  <View style={styles.statPill}>
    <View style={styles.statIconWrap}>{icon}</View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

// ─── Menu Row ───
const MenuRow = ({ item, isLast }: { item: any, isLast: boolean }) => {
  const Icon = item.icon;
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          style={styles.menuRow}
          onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: item.bg }]}>  
            <Icon color={item.color} size={20} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <ChevronRight color="#CBD5E1" size={18} />
        </Pressable>
      </Animated.View>
      {!isLast && <View style={styles.menuDivider} />}
    </View>
  );
};

export default function Profile() {
  const { user, token, logout, setUser } = useAuthStore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleAvatarPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateAvatar(result.assets[0].uri);
    }
  };

  const updateAvatar = async (uri: string) => {
    setIsUpdating(true);
    try {
      const url = await uploadToCloudinary(uri, 'avatars');
      await axios.patch(`${Config.API_URL}/users/profile`, { avatar: url }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (user) {
        setUser({ ...user, avatar_url: url });
      }
      Alert.alert("Success", "Profile photo updated!");
    } catch (err) {
      console.error("Avatar Update Error:", err);
      Alert.alert("Error", "Failed to update profile photo.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={true}>
        
        {/* ─── Hero Header ─── */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1', '#818CF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <SafeAreaView style={styles.heroSafe}>
            <Text style={styles.heroTitle}>Profile</Text>
          </SafeAreaView>
          
          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
        </LinearGradient>

        {/* ─── Profile Card (overlaps hero) ─── */}
        <View style={styles.profileCardWrap}>
          <View style={styles.profileCard}>
            {/* Avatar */}
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={handleAvatarPress}
              disabled={isUpdating}
              activeOpacity={0.85}
            >
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {user?.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
                    </LinearGradient>
                  )}
                  {isUpdating && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="#FFF" />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.cameraIconBadge}>
                <Camera color="#FFF" size={13} />
              </View>
              <View style={styles.onlineStatus} />
            </TouchableOpacity>

            {/* Name & Email */}
            <Text style={styles.username}>{user?.username || 'NexTalk User'}</Text>
            <Text style={styles.email}>{user?.email || 'user@nextalk.com'}</Text>

            {/* Edit Profile Button */}
            <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.8}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Stats Strip ─── */}
        <View style={styles.statsRow}>
          <StatPill value="128" label="Posts" icon={<MessageCircle size={14} color="#6366F1" />} />
          <StatPill value="4.2k" label="Followers" icon={<Heart size={14} color="#EC4899" />} />
          <StatPill value="892" label="Following" icon={<Star size={14} color="#F59E0B" />} />
        </View>

        {/* ─── Settings Sections ─── */}
        <View style={styles.settingsArea}>
          {SETTINGS_SECTIONS.map((section) => (
            <View key={section.title} style={styles.settingsSection}>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <MenuRow key={item.id} item={item} isLast={index === section.items.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ─── Logout ─── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut color="#EF4444" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>NexTalk v1.0.0 · Premium</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },

  // ─── Hero ───
  heroGradient: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  heroSafe: {
    paddingTop: Platform.OS === 'ios' ? 56 : 48,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  heroCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // ─── Profile Card ───
  profileCardWrap: {
    paddingHorizontal: 20,
    marginTop: -80,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarContainer: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 36,
    padding: 3,
    backgroundColor: '#FFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 16,
  },
  editProfileBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // ─── Stats ───
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: -1,
  },

  // ─── Settings ───
  settingsArea: {
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },

  // ─── Danger Zone ───
  dangerZone: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 80,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    height: 50,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
  versionText: {
    marginTop: 16,
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
});
