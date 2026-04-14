import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, SafeAreaView, ActivityIndicator, Animated, Dimensions, Platform, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors, Shadows } from '../../constants/Colors';
import { Search, X, ArrowRight, Check, Users, ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NewGroupScreen() {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fabScale = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
      else setUsers([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: selectedUsers.length > 0 ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, [selectedUsers.length]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    try {
      const resp = await axios.get(`${Config.API_URL}/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(resp.data);
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

  const handleNext = () => {
    if (selectedUsers.length === 0) return;
    const ids = selectedUsers.map(u => u.id).join(',');
    const names = selectedUsers.map(u => u.username).join(',');
    const avatars = selectedUsers.map(u => u.avatar_url || '').join(',');
    router.push({
      pathname: '/chat/group-details',
      params: { participantIds: ids, participantNames: names, participantAvatars: avatars }
    });
  };

  const renderSelectedChip = ({ item }: { item: any }) => (
    <View style={styles.chipContainer}>
      <Image
        source={{ uri: item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}` }}
        style={styles.chipAvatar}
      />
      <Text style={styles.chipName} numberOfLines={1}>{item.username}</Text>
      <TouchableOpacity
        onPress={() => toggleUser(item)}
        style={styles.chipRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X color="#FFF" size={10} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }: { item: any }) => {
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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Premium Gradient Header */}
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
              <Text style={styles.headerTitle}>New Group</Text>
              <Text style={styles.headerSubtitle}>
                {selectedUsers.length > 0
                  ? `${selectedUsers.length} participant${selectedUsers.length > 1 ? 's' : ''} selected`
                  : 'Add participants'}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Selected Users Horizontal Chips */}
      {selectedUsers.length > 0 && (
        <View style={styles.chipsSection}>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderSelectedChip}
            contentContainerStyle={styles.chipsList}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Search Bar */}
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

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.userList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Users color="#CBD5E1" size={48} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No users found' : 'Find your people'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'Search by username to add participants'}
            </Text>
          </View>
        )}
      />

      {/* Floating Next Button */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5'] as any}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ArrowRight color="#FFF" size={24} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
  chipContainer: {
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
    backgroundColor: '#FAFBFC',
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
    paddingBottom: 100,
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

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
});
