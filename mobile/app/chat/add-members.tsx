import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, SafeAreaView, ActivityIndicator, Platform, StatusBar, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Search, X, Check, ChevronLeft, UserPlus, Users } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Config } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function AddMembersScreen() {
  const router = useRouter();
  const { chatId, existingMemberIds } = useLocalSearchParams();
  const token = useAuthStore(state => state.token);
  const { addMembersToGroup } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingIds = (existingMemberIds as string)?.split(',').map(id => parseInt(id, 10)) || [];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
      else setUsers([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${Config.API_URL}/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out existing members
      const filtered = resp.data.filter((u: any) => !existingIds.includes(u.id));
      setUsers(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (user: any) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    setIsSubmitting(true);
    try {
      const memberIds = selectedUsers.map(u => u.id);
      await addMembersToGroup(chatId as string, memberIds);
      Alert.alert('Success', `${selectedUsers.length} member(s) added to the group.`);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
              <Text style={styles.headerTitle}>Add Members</Text>
              <Text style={styles.headerSubtitle}>
                {selectedUsers.length > 0
                  ? `${selectedUsers.length} selected`
                  : 'Search and select people'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={selectedUsers.length === 0 || isSubmitting}
              style={[styles.addHeaderBtn, selectedUsers.length === 0 && { opacity: 0.4 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.addHeaderText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Selected chips */}
      {selectedUsers.length > 0 && (
        <View style={styles.chipsSection}>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.chip}>
                <Image
                  source={{ uri: item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}` }}
                  style={styles.chipAvatar}
                />
                <Text style={styles.chipName} numberOfLines={1}>{item.username}</Text>
                <TouchableOpacity onPress={() => toggleUser(item)} style={styles.chipRemove}>
                  <X color="#FFF" size={10} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.chipsList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
          {searchQuery.length > 0 && !isLoading && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color="#94A3B8" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          const isSelected = !!selectedUsers.find(u => u.id === item.id);
          return (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => toggleUser(item)}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatarWrap}>
                <Image
                  source={{ uri: item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}` }}
                  style={styles.userAvatar}
                />
                {item.is_online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.username}</Text>
                <Text style={styles.userBio} numberOfLines={1}>
                  {item.bio || 'NexTalk member'}
                </Text>
              </View>
              <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                {isSelected && (
                  <LinearGradient
                    colors={Colors.gradientPrimary as any}
                    style={styles.radioInner}
                  >
                    <Check color="#FFF" size={12} strokeWidth={3} />
                  </LinearGradient>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.userList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <UserPlus color="#CBD5E1" size={48} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No users found' : 'Find new members'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Existing members are automatically excluded'
                : 'Search by username to add new members'}
            </Text>
          </View>
        )}
      />
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
  addHeaderBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHeaderText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
  },

  // Chips
  chipsSection: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  chipsList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingRight: 8,
    paddingLeft: 4,
    paddingVertical: 4,
    gap: 6,
  },
  chipAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    maxWidth: 80,
  },
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },

  // Users
  userList: {
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  userAvatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  userBio: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
    borderWidth: 0,
  },
  radioInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
