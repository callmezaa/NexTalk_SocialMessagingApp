import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Platform, SafeAreaView, ImageBackground, ActivityIndicator, StatusBar, Animated, Dimensions, Pressable } from 'react-native';
import { Search, Hash, Users, ArrowRight, Bell, MessageCircle, Sparkles, Shield, Compass, TrendingUp, Globe, ChevronRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { Config } from '../../constants/Config';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

// ─── Community Card ───
const CommunityCard = ({ group }: { group: any }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity 
        activeOpacity={0.95}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start()}
        style={styles.bannerCard}
      >
        <ImageBackground 
          source={{ uri: group.image }} 
          style={styles.bannerImage}
          imageStyle={styles.bannerImageRadius}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={styles.bannerOverlay}
          >
            <View style={styles.bannerTopRow}>
              <View style={styles.memberBadgeGlass}>
                <Users color="#FFF" size={11} />
                <Text style={styles.memberCountGlass}>{group.members}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.bannerName}>{group.name}</Text>
              <Text style={styles.bannerDesc} numberOfLines={1}>{group.desc}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── User Discovery Card ───
const UserCard = ({ user, onConnect }: { user: any, onConnect: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.discoverCard, { transform: [{ scale }] }]}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        style={styles.discoverCardInner}
      >
        <View style={styles.discoverAvatarOuter}>
          <Image source={{ uri: user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}` }} style={styles.discoverAvatar} />
          {user.is_online && <View style={styles.discoverOnline} />}
        </View>
        
        <Text style={styles.discoverName} numberOfLines={1}>{user.username}</Text>
        <Text style={styles.discoverBio} numberOfLines={1}>{user.bio || 'NexTalk Member'}</Text>
        
        <TouchableOpacity style={styles.messageBtn} onPress={onConnect} activeOpacity={0.85}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.messageBtnInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MessageCircle color="#FFF" size={14} style={{ marginRight: 5 }} />
            <Text style={styles.messageBtnText}>Connect</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const featuredCommunities = [
    { id: 1, name: 'AI Builders', members: '12K', desc: 'Building the next gen of AI products.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400' },
    { id: 2, name: 'NextTalk Labs', members: '5.2K', desc: 'Early beta testers for new features.', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400' },
    { id: 3, name: 'Design Masters', members: '8.4K', desc: 'Minimalist UI/UX group.', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=400' },
  ];

  const trendingTopics = [
    { id: 1, tag: 'NextTalk', icon: <Hash size={13} color="#6366F1" strokeWidth={2.5} />, color: 'rgba(99,102,241,0.1)' },
    { id: 2, tag: 'AI Trends', icon: <Sparkles size={13} color="#F59E0B" strokeWidth={2.5} />, color: 'rgba(245,158,11,0.1)' },
    { id: 3, tag: 'Engineering', icon: <Shield size={13} color="#10B981" strokeWidth={2.5} />, color: 'rgba(16,185,129,0.1)' },
    { id: 4, tag: 'Design', icon: <TrendingUp size={13} color="#EC4899" strokeWidth={2.5} />, color: 'rgba(236,72,153,0.1)' },
  ];

  const quickActions = [
    { id: 1, label: 'New Group', icon: <Users size={20} color="#6366F1" />, colors: ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.06)'], onPress: () => router.push('/chat/new-group') },
    { id: 2, label: 'Invite', icon: <Globe size={20} color="#10B981" />, colors: ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.06)'], onPress: () => {} },
    { id: 3, label: 'NexBot', icon: <Sparkles size={20} color="#F59E0B" />, colors: ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.06)'], onPress: () => router.push('/(tabs)/nexbot') },
  ];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const resp = await axios.get(`${Config.API_URL}/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(resp.data);
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (targetUserId: number) => {
    try {
      const resp = await axios.post(`${Config.API_URL}/chats`, 
        { target_user_id: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/chat/${resp.data.id}`);
    } catch (err) {
      console.error("Start Chat Error:", err);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ─── Header ─── */}
      <View style={styles.headerOuter}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeftCol}>
              <View style={styles.headerIconRow}>
                <Compass color="#6366F1" size={22} strokeWidth={2.5} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Explore</Text>
                <Text style={styles.headerSubtitle}>Discover & connect</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellButton}>
              <Bell color="#475569" size={20} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search color="#94A3B8" size={17} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users, groups..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {isSearching && <ActivityIndicator size="small" color="#6366F1" />}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 170, paddingBottom: 110 }}
      >
        {/* ─── Quick Actions ─── */}
        {!searchQuery && (
          <View style={styles.quickActionsRow}>
            {quickActions.map(action => (
              <TouchableOpacity key={action.id} style={styles.quickAction} activeOpacity={0.7} onPress={action.onPress}>
                <LinearGradient colors={action.colors as any} style={styles.quickActionIcon}>
                  {action.icon}
                </LinearGradient>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Featured Communities ─── */}
        {!searchQuery && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Communities</Text>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight color="#6366F1" size={16} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScroll}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
            >
              {featuredCommunities.map(group => (
                <CommunityCard key={group.id} group={group} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Trending Topics ─── */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleInline}>Trending</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
              {trendingTopics.map(topic => (
                <TouchableOpacity key={topic.id} style={styles.tagPill} activeOpacity={0.7}>
                  <View style={[styles.tagIconWrap, { backgroundColor: topic.color }]}>
                    {topic.icon}
                  </View>
                  <Text style={styles.tagText}>{topic.tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Discovery / Search Results ─── */}
        <View style={styles.section}>
          {searchQuery ? (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Results</Text>
              <View style={styles.resultCountPill}>
                <Text style={styles.resultCountText}>{searchResults.length}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.sectionTitleInline}>People to Connect</Text>
          )}
          
          <View style={styles.discoveryGrid}>
            {(searchQuery ? searchResults : []).map((user) => (
              <UserCard key={user.id} user={user} onConnect={() => handleStartChat(user.id)} />
            ))}

            {!searchQuery && (
              <View style={styles.suggestedEmpty}>
                <LinearGradient colors={['rgba(99,102,241,0.08)', 'rgba(168,85,247,0.08)']} style={styles.emptyIconWrap}>
                  <Search color="#6366F1" size={32} />
                </LinearGradient>
                <Text style={styles.suggestedEmptyTitle}>Find Your People</Text>
                <Text style={styles.suggestedEmptySub}>Search for names like "alice" or "bob" to start connecting.</Text>
              </View>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <View style={styles.suggestedEmpty}>
                <LinearGradient colors={['rgba(148,163,184,0.1)', 'rgba(148,163,184,0.05)']} style={styles.emptyIconWrap}>
                  <Users color="#94A3B8" size={32} />
                </LinearGradient>
                <Text style={styles.suggestedEmptyTitle}>No results found</Text>
                <Text style={styles.suggestedEmptySub}>Try a different search term</Text>
              </View>
            )}
          </View>
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
  
  // ─── Header ───
  headerOuter: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconRow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: -1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  // ─── Search ───
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },

  // ─── Quick Actions ───
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  // ─── Sections ───
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionTitleInline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  resultCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  resultCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
  },

  // ─── Community Cards ───
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bannerCard: {
    width: CARD_WIDTH,
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    flex: 1,
  },
  bannerImageRadius: {
    borderRadius: 20,
  },
  bannerOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  bannerTopRow: {
    alignItems: 'flex-start',
  },
  memberBadgeGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  memberCountGlass: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '800',
  },
  bannerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 3,
  },
  bannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },

  // ─── Trending Tags ───
  tagsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    gap: 8,
  },
  tagIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // ─── Discovery Grid ───
  discoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  discoverCard: {
    width: (SCREEN_WIDTH - 42) / 2,
  },
  discoverCardInner: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  discoverAvatarOuter: {
    position: 'relative',
    marginBottom: 10,
  },
  discoverAvatar: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  discoverOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  discoverName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
    textAlign: 'center',
  },
  discoverBio: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  messageBtn: {
    width: '100%',
  },
  messageBtnInner: {
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // ─── Empty States ───
  suggestedEmpty: {
    width: '100%',
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestedEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  suggestedEmptySub: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
});
