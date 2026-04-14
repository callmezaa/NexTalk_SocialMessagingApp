import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Platform, ScrollView, RefreshControl, Animated, Modal, Dimensions, StatusBar, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors, Shadows, Spacing } from '../../constants/Colors';
import { Search, Plus, X, Users, Bell, MessageCircle, Phone, MailOpen, Send, Heart, ChevronUp, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video as VideoIcon, Info } from 'lucide-react-native';
import { useChatStore, Story } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Config } from '../../constants/Config';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Types ---
interface UserStoryGroup {
  userId: number;
  user: {
    username: string;
    avatar_url: string;
  };
  stories: Story[];
}

// ─── Premium Story Circle ───
const StoryCircle = ({ 
  user, 
  isUser = false,
  onPress,
  onAddPress,
  isUploading = false
}: { 
  user?: any, 
  isUser?: boolean,
  onPress: () => void,
  onAddPress?: () => void,
  isUploading?: boolean
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const avatarUri = isUser 
    ? (user?.avatar_url || 'https://i.pravatar.cc/150?u=me')
    : (user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, friction: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };

  return (
    <View style={styles.storyCircleContainer}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity 
          activeOpacity={0.85} 
          style={styles.storyAvatarWrap} 
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient 
            colors={isUser ? ['#E2E8F0', '#CBD5E1'] : ['#6366F1', '#A855F7', '#EC4899']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.storyRing}
          >
            <View style={styles.storyInnerWhite}>
              <Image source={{ uri: avatarUri }} style={styles.storyImg} />
            </View>
          </LinearGradient>
          {isUser && !isUploading && (
            <TouchableOpacity style={styles.addBtnSmall} onPress={onAddPress}>
              <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.addBtnGradient}>
                <Plus color={Colors.white} size={12} strokeWidth={4} />
              </LinearGradient>
            </TouchableOpacity>
          )}
          {isUploading && (
            <View style={styles.uploadOverlaySmall}>
              <ActivityIndicator size="small" color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.storyLabel} numberOfLines={1}>{isUser ? 'My Story' : user.username}</Text>
    </View>
  );
};

// ─── Filter Tab Bar ───
const FILTER_TABS = [
  { key: 'all', label: 'All Chats', icon: <MessageCircle size={15} strokeWidth={2.5} /> },
  { key: 'unread', label: 'Unread', icon: <MailOpen size={15} strokeWidth={2.5} /> },
  { key: 'calls', label: 'Calls', icon: <Phone size={15} strokeWidth={2.5} /> },
] as const;

type FilterKey = typeof FILTER_TABS[number]['key'];

const FilterTabBar = ({ active, onChange, unreadCount }: {
  active: FilterKey,
  onChange: (key: FilterKey) => void,
  unreadCount: number,
}) => {
  return (
    <View style={styles.filterBar}>
      {FILTER_TABS.map((tab) => {
        const isActive = active === tab.key;
        const showBadge = tab.key === 'unread' && unreadCount > 0;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.7}
            onPress={() => onChange(tab.key)}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
          >
            {isActive ? (
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
              />
            ) : null}
            {React.cloneElement(tab.icon, { color: isActive ? '#FFF' : '#64748B' })}
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
            {showBadge && (
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Premium Chat Row ───
const ChatRow = ({ item, index, onPress }: { item: any, index: number, onPress: () => void }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }, { scale }], opacity }}>
      <Pressable 
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        style={({ pressed }) => [
          styles.chatRow,
          pressed && styles.chatRowPressed
        ]}
      >
        <View style={styles.rowAvatarContainer}>
          {item.unread > 0 && (
            <LinearGradient
              colors={['#6366F1', '#A855F7']}
              style={styles.avatarGlowActive}
            />
          )}
          <Image source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }} style={styles.rowAvatar} />
          {item.isGroup ? (
            <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.groupBadge}>
              <Users color="#FFF" size={10} strokeWidth={3} />
            </LinearGradient>
          ) : (
            item.online && <View style={styles.onlineStatusRing} />
          )}
        </View>
        
        <View style={styles.rowContent}>
          <View style={styles.rowTopLine}>
            <Text style={[styles.rowName, item.unread > 0 && { color: '#0F172A' }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.rowTime, item.unread > 0 && { color: '#6366F1', fontWeight: '800' }]}>{item.time}</Text>
          </View>
          
          <View style={styles.rowBottomLine}>
            <Text style={[styles.rowMsg, item.unread > 0 && styles.rowMsgUnread]} numberOfLines={1}>
              {item.lastMessage || 'Start a conversation...'}
            </Text>
            {item.unread > 0 && (
              <LinearGradient 
                colors={['#6366F1', '#4F46E5']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.unreadCountBadge}
              >
                <Text style={styles.unreadCountText}>{item.unread}</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const CallRow = ({ item, index }: { item: any, index: number }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getCallIcon = () => {
    if (item.type === 'missed') return <PhoneMissed size={14} color="#F43F5E" />;
    if (item.type === 'incoming') return <PhoneIncoming size={14} color="#10B981" />;
    return <PhoneOutgoing size={14} color="#6366F1" />;
  };

  const getCallTime = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return isoDate; }
  };

  return (
    <Animated.View style={{ transform: [{ translateX }, { scale }], opacity }}>
      <Pressable 
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()}
        style={({ pressed }) => [
          styles.chatRow,
          pressed && styles.chatRowPressed,
          item.type === 'missed' && styles.missedCallRow
        ]}
      >
        <View style={styles.rowAvatarContainer}>
          <Image source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }} style={styles.rowAvatar} />
        </View>
        
        <View style={styles.rowContent}>
          <View style={styles.rowTopLine}>
            <Text style={[styles.rowName, item.type === 'missed' && { color: '#F43F5E' }]} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.rowTime}>{getCallTime(item.time)}</Text>
          </View>
          
          <View style={styles.rowBottomLine}>
            <View style={styles.callInfoRow}>
              {getCallIcon()}
              <Text style={[styles.rowMsg, item.type === 'missed' && { color: '#F43F5E', fontWeight: '600' }]} numberOfLines={1}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {item.duration && item.duration !== '0:00' ? `• ${item.duration}` : ''}
              </Text>
            </View>
            <View style={styles.callActions}>
              <TouchableOpacity style={styles.callActionBtn}>
                {item.isVideo ? <VideoIcon size={16} color="#6366F1" strokeWidth={2.5} /> : <Phone size={16} color="#6366F1" strokeWidth={2.5} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoActionBtn}>
                <Info size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const DateHeader = ({ title }: { title: string }) => (
  <View style={styles.dateHeader}>
    <Text style={styles.dateHeaderText}>{title}</Text>
    <View style={styles.dateHeaderLine} />
  </View>
);

// ─── Story Viewer Modal (Premium) ───
const StoryViewerModal = ({ visible, userGroup, onHide }: { visible: boolean, userGroup: UserStoryGroup | null, onHide: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      startAnim();
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) startAnim();
  }, [currentIndex]);

  const startAnim = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) next();
    });
  };

  const next = () => {
    if (userGroup && currentIndex < userGroup.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onHide();
    }
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else { progress.setValue(0); startAnim(); }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return 'Just now'; }
  };

  if (!userGroup) return null;
  const currentStory = userGroup.stories[currentIndex];

  return (
    <Modal visible={visible} animationType="none" transparent>
      <Animated.View style={[styles.viewerContainer, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" />
        
        {/* Blurred background layer */}
        <Image source={{ uri: currentStory?.mediaUrl }} style={StyleSheet.absoluteFill} blurRadius={50} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        
        {/* Story Content */}
        <Animated.View style={[styles.viewerStoryWrap, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity activeOpacity={1} style={styles.viewerMain} onPress={(e) => {
            const x = e.nativeEvent.locationX;
            if (x < SCREEN_WIDTH / 3) prev(); else next();
          }}>
            <Image source={{ uri: currentStory?.mediaUrl }} style={styles.viewerImg} resizeMode="cover" />
            
            {/* Gradient overlays for readability */}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={styles.viewerGradientTop}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.viewerGradientBottom}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Header (over story) ─── */}
        <SafeAreaView style={styles.viewerHeader}>
          {/* Progress Bars */}
          <View style={styles.vProgBarWrap}>
            {userGroup.stories.map((_, i) => (
              <View key={i} style={styles.vProgBg}>
                <Animated.View style={[
                  styles.vProgFill, 
                  { 
                    width: i < currentIndex 
                      ? '100%' 
                      : i === currentIndex 
                        ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%' 
                  }
                ]} />
              </View>
            ))}
          </View>

          {/* User Info Row */}
          <View style={styles.vUserRow}>
            <View style={styles.vUserInfo}>
              <LinearGradient
                colors={['#6366F1', '#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.vAvatarRing}
              >
                <View style={styles.vAvatarInner}>
                  <Image source={{ uri: userGroup.user.avatar_url || `https://i.pravatar.cc/150?u=${userGroup.userId}` }} style={styles.vUserAvatar} />
                </View>
              </LinearGradient>
              <View>
                <Text style={styles.vUserName}>{userGroup.user.username}</Text>
                <Text style={styles.vUserTime}>{getTimeAgo(currentStory?.createdAt)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onHide} style={styles.vCloseBtn}>
              <X color="#FFF" size={20} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ─── Bottom Bar ─── */}
        <SafeAreaView style={styles.viewerBottomSafe}>
          <View style={styles.viewerBottomBar}>
            <View style={styles.viewerReplyRow}>
              <View style={styles.viewerReplyInput}>
                <Text style={styles.viewerReplyPlaceholder}>Reply to story...</Text>
              </View>
              <View style={styles.viewerQuickReactions}>
                {['❤️', '🔥', '😂'].map((emoji) => (
                  <TouchableOpacity key={emoji} style={styles.viewerEmojiBtn} activeOpacity={0.7}>
                    <Text style={styles.viewerEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.viewerShareBtn} activeOpacity={0.7}>
                  <Send color="#FFF" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>

        {/* Story counter */}
        {userGroup.stories.length > 1 && (
          <View style={styles.storyCounter}>
            <Text style={styles.storyCounterText}>{currentIndex + 1}/{userGroup.stories.length}</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Main Screen ───

export default function ChatList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<UserStoryGroup | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  
  const { chats, fetchChats, isLoading, stories, fetchStories, createStory, calls, fetchCalls } = useChatStore();
  const { user, token } = useAuthStore();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchChats();
    fetchStories();
    fetchCalls();
  }, []);

  const grouped: UserStoryGroup[] = [];
  stories.forEach(s => {
    let g = grouped.find(x => x.userId === s.userId);
    if (!g) {
      g = { userId: s.userId, user: { username: s.user.username, avatar_url: s.user.avatar_url }, stories: [] };
      grouped.push(g);
    }
    g.stories.push(s);
  });

  const myStories = grouped.find(g => g.userId === user?.id);
  const others = grouped.filter(g => g.userId !== user?.id);
  const totalUnread = chats.reduce((acc, c) => acc + (c.unread || 0), 0);

  const handlePick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [9, 16], quality: 0.8 });
    if (!res.canceled) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        const uri = res.assets[0].uri;
        formData.append('image', { uri, name: 'st.jpg', type: 'image/jpeg' } as any);
        const up = await axios.post(`${Config.API_URL}/upload?folder=stories`, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
        if (up.data.url) await createStory(up.data.url);
      } catch (e) { console.error(e); } finally { setIsUploading(false); }
    }
  };

  // Filter and group data
  const filteredChats = chats
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => {
      if (activeFilter === 'unread') return (c.unread || 0) > 0;
      return true;
    });

  const getGroupedData = () => {
    if (activeFilter !== 'calls') return filteredChats;

    const groups: { title: string, data: any[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const sortedCalls = [...calls].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    sortedCalls.forEach(call => {
      const callDate = new Date(call.time).toDateString();
      let title = 'Older';
      if (callDate === today) title = 'Today';
      else if (callDate === yesterday) title = 'Yesterday';

      let group = groups.find(g => g.title === title);
      if (!group) {
        group = { title, data: [] };
        groups.push(group);
      }
      group.data.push(call);
    });

    // Flatten for simple FlatList usage with headers
    const flattened: any[] = [];
    groups.sort((a, b) => {
      const order = { 'Today': 0, 'Yesterday': 1, 'Older': 2 };
      return (order[a.title as keyof typeof order] ?? 3) - (order[b.title as keyof typeof order] ?? 3);
    }).forEach(g => {
      flattened.push({ isHeader: true, title: g.title });
      g.data.forEach((d, idx) => flattened.push({ ...d, index: idx }));
    });
    return flattened;
  };

  const displayData = getGroupedData();

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* ─── Premium Fixed Header ─── */}
      <View style={styles.headerOuter}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.logoRow}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.logoPill}
                >
                  <MessageCircle color="#FFF" size={16} strokeWidth={2.5} />
                </LinearGradient>
                <View>
                  <Text style={styles.headerBrand}>NexTalk</Text>
                  <Text style={styles.headerBrandTag}>Premium</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIconCircle} onPress={() => router.push('/chat/search')}>
                <Search color="#475569" size={19} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconCircle}>
                <Bell color="#475569" size={19} />
                {totalUnread > 0 && (
                  <View style={styles.notifDot} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <Animated.FlatList
        data={displayData}
        keyExtractor={item => (activeFilter === 'calls' ? `call-${item.id}` : `chat-${item.id}`)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          if (item.isHeader) return <DateHeader title={item.title} />;
          return activeFilter === 'calls' ? (
            <CallRow item={item} index={item.index ?? index} />
          ) : (
            <ChatRow item={item} index={index} onPress={() => router.push(`/chat/${item.id}`)} />
          );
        }}
        ListHeaderComponent={() => (
          <View style={styles.listHeaderArea}>
            {/* ─── Stories Section ─── */}
            <View style={styles.storySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Stories</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionViewAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                <StoryCircle isUser user={user} onPress={() => myStories && setSelectedGroup(myStories)} onAddPress={handlePick} isUploading={isUploading} />
                {others.map(g => (
                  <StoryCircle key={g.userId} user={{ id: g.userId, ...g.user }} onPress={() => setSelectedGroup(g)} />
                ))}
              </ScrollView>
            </View>

            {/* ─── Filter Tab Bar ─── */}
            <FilterTabBar
              active={activeFilter}
              onChange={setActiveFilter}
              unreadCount={totalUnread}
            />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchChats(); fetchStories(); fetchCalls(); }} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingTop: 110, paddingBottom: 120 }}
        overScrollMode="always"
        bounces={true}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <LinearGradient colors={['rgba(99,102,241,0.1)', 'rgba(168,85,247,0.1)']} style={styles.emptyIconWrap}>
              {activeFilter === 'calls' ? (
                <Phone color="#6366F1" size={40} />
              ) : (
                <MessageCircle color="#6366F1" size={40} />
              )}
            </LinearGradient>
            <Text style={styles.emptyTitle}>{activeFilter === 'calls' ? 'No Call History' : 'No Chats Yet'}</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'calls' 
                ? 'Your recent voice and video calls will appear here' 
                : 'Start a conversation or explore new connections'}
            </Text>
          </View>
        )}
      />

      {/* ─── Premium FAB ─── */}
      <TouchableOpacity 
        style={styles.premiumFab} 
        activeOpacity={0.9}
        onPress={() => router.push('/chat/new-group')}
      >
        <LinearGradient 
          colors={['#6366F1', '#4F46E5']} 
          style={styles.fabInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Plus color="#FFF" size={28} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      <StoryViewerModal visible={!!selectedGroup} userGroup={selectedGroup} onHide={() => setSelectedGroup(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // ─── Header ───
  headerOuter: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  headerBrandTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadows.soft,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },

  listHeaderArea: {
    paddingTop: 4,
  },

  // ─── Stories ───
  storySection: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionViewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  storiesScroll: { 
    paddingLeft: 20, 
    paddingRight: 20,
    gap: 14, 
    paddingBottom: 4 
  },
  storyCircleContainer: { alignItems: 'center', width: 76 },
  storyAvatarWrap: { position: 'relative', marginBottom: 8 },
  storyRing: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    padding: 2.5, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  storyInnerWhite: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 34, 
    backgroundColor: '#FFF', 
    padding: 2.5 
  },
  storyImg: { width: '100%', height: '100%', borderRadius: 31 },
  addBtnSmall: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    borderWidth: 2.5, 
    borderColor: '#FFF',
    overflow: 'hidden',
  },
  addBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlaySmall: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderRadius: 36, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  storyLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', marginTop: 2 },

  // ─── Filter Tab Bar ───
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
    marginTop: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    position: 'relative',
    overflow: 'hidden',
  },
  filterTabActive: {
    borderColor: 'transparent',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 2,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6366F1',
  },
  filterBadgeTextActive: {
    color: '#FFF',
  },

  // ─── Chats ───
  chatRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.8)',
  },
  chatRowPressed: {
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  rowAvatarContainer: { position: 'relative', marginRight: 14 },
  rowAvatar: { 
    width: 54, 
    height: 54, 
    borderRadius: 20, 
    backgroundColor: '#F1F5F9',
  },
  avatarGlowActive: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    opacity: 0.15,
  },
  onlineStatusRing: { 
    position: 'absolute', 
    bottom: 0, 
    right: -1, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    backgroundColor: '#22C55E', 
    borderWidth: 3, 
    borderColor: '#FFF',
  },
  groupBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 22, 
    height: 22, 
    borderRadius: 8, 
    borderWidth: 2.5, 
    borderColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  rowContent: { flex: 1, justifyContent: 'center' },
  rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  rowName: { fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: -0.2, flex: 1, marginRight: 8 },
  rowTime: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  rowBottomLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowMsg: { flex: 1, fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  rowMsgUnread: { color: '#475569', fontWeight: '700' },
  unreadCountBadge: { 
    minWidth: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 7,
    marginLeft: 10,
  },
  unreadCountText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  
  // ─── Call Row Styles ───
  callTypeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  callInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callActions: {
    flexDirection: 'row',
    gap: 4,
  },
  missedCallRow: {
    backgroundColor: 'rgba(244, 63, 94, 0.02)',
    borderColor: 'rgba(244, 63, 94, 0.1)',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 12,
  },

  // ─── Empty State ───
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── FAB ───
  premiumFab: { 
    position: 'absolute', 
    right: 24, 
    bottom: 100, 
    width: 60, 
    height: 60, 
    borderRadius: 22, 
    ...Shadows.premium, 
    shadowOpacity: 0.3, 
    shadowColor: '#6366F1',
  },
  fabInner: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Story Viewer ───
  viewerContainer: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  viewerStoryWrap: {
    flex: 1,
    margin: 6,
    marginTop: Platform.OS === 'ios' ? 50 : 36,
    marginBottom: Platform.OS === 'ios' ? 90 : 70,
    borderRadius: 18,
    overflow: 'hidden',
  },
  viewerMain: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  viewerImg: { 
    width: '100%', 
    height: '100%',
  },
  viewerGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  viewerGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  viewerHeader: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    paddingHorizontal: 18, 
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    zIndex: 10,
  },
  vProgBarWrap: { 
    flexDirection: 'row', 
    gap: 4, 
    marginBottom: 12,
  },
  vProgBg: { 
    flex: 1, 
    height: 2.5, 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    borderRadius: 2, 
    overflow: 'hidden',
  },
  vProgFill: { 
    height: '100%', 
    backgroundColor: '#FFF', 
    borderRadius: 2,
  },
  vUserRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  vUserInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 10,
  },
  vAvatarRing: {
    width: 40,
    height: 40,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  vUserAvatar: { 
    width: '100%', 
    height: '100%',
  },
  vUserName: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  vUserTime: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 11, 
    fontWeight: '600',
    marginTop: 1,
  },
  vCloseBtn: { 
    width: 34, 
    height: 34, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
  },

  // Bottom Bar
  viewerBottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  viewerBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 14,
  },
  viewerReplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewerReplyInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  viewerReplyPlaceholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  viewerQuickReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerEmojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerEmoji: {
    fontSize: 20,
  },
  viewerShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Story Counter
  storyCounter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  storyCounterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
});
