import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert, ScrollView, Platform, StatusBar, Dimensions } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Colors, Shadows } from '../../constants/Colors';
import { Camera, Users, ChevronLeft, Sparkles } from 'lucide-react-native';
import { useChatStore } from '../../store/chatStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../utils/upload';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { participantIds, participantNames, participantAvatars } = useLocalSearchParams();
  const { createGroup } = useChatStore();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  // Parse participant data from params
  const ids = (participantIds as string)?.split(',') || [];
  const names = (participantNames as string)?.split(',') || [];
  const avatars = (participantAvatars as string)?.split(',') || [];

  const participants = ids.map((id, index) => ({
    id,
    username: names[index] || `User ${id}`,
    avatar_url: avatars[index] || '',
  }));

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing Name', 'Please enter a group name to continue.');
      return;
    }

    setIsSubmitting(true);
    let finalAvatarUrl = '';

    try {
      if (avatarUri) {
        setIsUploading(true);
        finalAvatarUrl = await uploadToCloudinary(avatarUri, 'groups');
        setIsUploading(false);
      }

      const numericIds = ids.map(id => parseInt(id, 10));
      const newChat = await createGroup(groupName, numericIds, description, finalAvatarUrl);

      router.replace(`/chat/${newChat.id}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const isValid = groupName.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Gradient Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1', '#818CF8'] as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft color="#FFF" size={26} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Group Details</Text>
              <Text style={styles.headerSubtitle}>Customize your group</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={handlePickImage}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE'] as any}
                style={styles.avatarPlaceholder}
              >
                <Users color="#6366F1" size={36} />
              </LinearGradient>
            )}
            <View style={styles.cameraOverlay}>
              <Camera color="#FFF" size={14} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.avatarLabel}>
              {avatarUri ? 'Change Photo' : 'Add Group Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group name input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>GROUP NAME</Text>
          <View style={[
            styles.inputWrap,
            nameFocused && styles.inputWrapFocused,
          ]}>
            <Sparkles color={nameFocused ? Colors.primary : '#94A3B8'} size={18} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Project Alpha"
              placeholderTextColor="#94A3B8"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
          <View style={[
            styles.inputWrap,
            styles.textAreaWrap,
            descFocused && styles.inputWrapFocused,
          ]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What's this group about?"
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
          </View>
        </View>

        {/* Participant Preview */}
        <View style={styles.participantSection}>
          <Text style={styles.inputLabel}>PARTICIPANTS · {participants.length}</Text>
          <View style={styles.participantList}>
            {participants.map((p, index) => (
              <View key={p.id} style={styles.participantItem}>
                <Image
                  source={{ uri: p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}` }}
                  style={styles.participantAvatar}
                />
                <Text style={styles.participantName} numberOfLines={1}>
                  {p.username}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <View style={styles.createSection}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSubmitting || isUploading || !isValid}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isValid ? ['#6366F1', '#4F46E5'] as any : ['#CBD5E1', '#CBD5E1'] as any}
              style={styles.createBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isSubmitting || isUploading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                  <Text style={styles.createBtnText}>
                    {isUploading ? 'Uploading Photo...' : 'Creating Group...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.createBtnText}>Create Group</Text>
              )}
            </LinearGradient>
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

  // Header
  header: {
    paddingBottom: 20,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 35,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 2,
  },

  // Content
  content: {
    padding: 24,
    paddingBottom: 50,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FAFBFC',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarLabel: {
    marginTop: 12,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Input
  inputSection: {
    marginBottom: 22,
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  textAreaWrap: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputWrapFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFAFE',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },

  // Participants
  participantSection: {
    marginBottom: 28,
  },
  participantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  participantItem: {
    alignItems: 'center',
    width: 64,
  },
  participantAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#FFF',
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  participantName: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  // Create
  createSection: {
    marginTop: 10,
  },
  createBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
