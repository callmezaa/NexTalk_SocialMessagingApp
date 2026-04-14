import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Image, Animated, Modal, Pressable, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors, Shadows } from '../../constants/Colors';
import { useChatStore, ChatMessage } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Send, ChevronLeft, Phone, Video, Camera, Mic, Check, CheckCheck, Smile, MoreVertical, Paperclip, Image as ImageIcon, Play, Pause, Trash2, Square, MicOff } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary, uploadAudioToCloudinary } from '../../utils/upload';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAudioPlayer, 
  // useAudioRecorder, // Disabled for Expo Go compatibility
  // useAudioRecorderState, 
  // RecordingPresets 
} from 'expo-audio';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

type MessageOrDate = ChatMessage | { type: 'date'; date: string; id: string };

// ─── Elegant Message Bubble ───

const MessageBubble = ({
  msg, isMine, isRead, isImage, isFirstInGroup, isLastInGroup, onLongPress,
}: {
  msg: ChatMessage; isMine: boolean; isRead: boolean;
  isImage: boolean; isFirstInGroup: boolean; isLastInGroup: boolean;
  onLongPress: (msgId: string) => void;
}) => {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, []);

  const R = 18;
  const miniBR = 5;

  // Dynamic border radius for WhatsApp-like grouping
  const bubbleRadius = isMine
    ? {
        borderTopLeftRadius: R,
        borderTopRightRadius: isFirstInGroup ? R : miniBR,
        borderBottomLeftRadius: R,
        borderBottomRightRadius: isLastInGroup ? R : miniBR,
      }
    : {
        borderTopLeftRadius: isFirstInGroup ? R : miniBR,
        borderTopRightRadius: R,
        borderBottomLeftRadius: isLastInGroup ? R : miniBR,
        borderBottomRightRadius: R,
      };

  const timeStr = (() => {
    try {
      return new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  })();

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isMine ? styles.msgRowMine : styles.msgRowTheirs,
        {
          marginBottom: isLastInGroup ? 10 : 2,
          opacity: enterAnim,
          transform: [{
            translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
          }],
        },
      ]}
    >
      <Pressable
        onLongPress={() => onLongPress(msg.id)}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        style={{ maxWidth: MAX_BUBBLE_WIDTH }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {isMine ? (
            msg.type === 'image' ? (
              /* ── My Image Message ── */
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.imgBubble, bubbleRadius]}
              >
                <Image source={{ uri: msg.content }} style={styles.imgContent} resizeMode="cover" />
                <View style={styles.imgTimeBadge}>
                  <Text style={styles.imgTimeText}>{timeStr}</Text>
                  {isRead ? <CheckCheck size={11} color="#FFF" /> : <Check size={11} color="rgba(255,255,255,0.6)" />}
                </View>
              </LinearGradient>
            ) : msg.type === 'voice' ? (
              /* ── My Voice Message ── */
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, bubbleRadius, { minWidth: 200 }]}
              >
                <VoiceBubble uri={msg.content} isMine={true} />
                <View style={styles.metaRow}>
                  <Text style={styles.timeMine}>{timeStr}</Text>
                  {isRead
                    ? <CheckCheck size={12} color="#C7D2FE" style={{ marginLeft: 3 }} />
                    : <Check size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 3 }} />
                  }
                </View>
              </LinearGradient>
            ) : (
              /* ── My Text Message ── */
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, bubbleRadius]}
              >
                <Text style={[styles.msgText, styles.msgTextMine]}>{msg.content}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.timeMine}>{timeStr}</Text>
                  {isRead
                    ? <CheckCheck size={12} color="#C7D2FE" style={{ marginLeft: 3 }} />
                    : <Check size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 3 }} />
                  }
                </View>
              </LinearGradient>
            )
          ) : (
            msg.type === 'image' ? (
              /* ── Their Image Message ── */
              <View style={[styles.imgBubble, styles.bubbleOther, bubbleRadius]}>
                <Image source={{ uri: msg.content }} style={styles.imgContent} resizeMode="cover" />
                <View style={[styles.imgTimeBadge, { right: undefined, left: 8 }]}>
                  <Text style={styles.imgTimeText}>{timeStr}</Text>
                </View>
              </View>
            ) : msg.type === 'voice' ? (
              /* ── Their Voice Message ── */
              <View style={[styles.bubble, styles.bubbleOther, bubbleRadius, { minWidth: 200 }]}>
                <VoiceBubble uri={msg.content} isMine={false} />
                <View style={styles.metaRow}>
                  <Text style={styles.timeOther}>{timeStr}</Text>
                </View>
              </View>
            ) : (
              /* ── Their Text Message ── */
              <View style={[styles.bubble, styles.bubbleOther, bubbleRadius]}>
                <Text style={[styles.msgText, styles.msgTextOther]}>{msg.content}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.timeOther}>{timeStr}</Text>
                </View>
              </View>
            )
          )}
        </Animated.View>
      </Pressable>

      {/* Reaction badge */}
      {msg.reactions && msg.reactions.length > 0 && (
        <View style={[styles.reacBadge, isMine ? { right: 6 } : { left: 6 }]}>
          <Text style={{ fontSize: 14 }}>{msg.reactions[0].emoji}</Text>
          {msg.reactions.length > 1 && (
            <Text style={styles.reacCount}>{msg.reactions.length}</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Voice Message Bubble ───

const VoiceBubble = ({ uri, duration, isMine }: { uri: string; duration?: number; isMine: boolean }) => {
  const player = useAudioPlayer(uri);
  const isPlaying = player.playing;
  const progress = player.duration > 0 ? player.currentTime / player.duration : 0;
  
  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Waveform bars
  const barHeights = useRef(
    Array.from({ length: 20 }, () => 0.25 + Math.random() * 0.75)
  ).current;

  return (
    <View style={styles.voiceRow}>
      <TouchableOpacity onPress={togglePlayback} style={styles.voicePlayBtn} activeOpacity={0.7}>
        {isPlaying ? (
          <Pause color={isMine ? '#FFF' : Colors.primary} size={18} fill={isMine ? '#FFF' : Colors.primary} />
        ) : (
          <Play color={isMine ? '#FFF' : Colors.primary} size={18} fill={isMine ? '#FFF' : Colors.primary} />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {barHeights.map((h, i) => {
          const isActive = progress > i / barHeights.length;
          return (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: h * 24,
                  backgroundColor: isMine
                    ? isActive ? '#FFF' : 'rgba(255,255,255,0.35)'
                    : isActive ? Colors.primary : '#CBD5E1',
                },
              ]}
            />
          );
        })}
      </View>

      <Text style={[styles.voiceDuration, isMine ? { color: 'rgba(255,255,255,0.7)' } : { color: '#94A3B8' }]}>
        {formatTime(isPlaying || progress > 0 ? player.currentTime : (duration ? duration * 1000 : player.duration))}
      </Text>
    </View>
  );
};

// ─── Typing Indicator ───

const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 150).start();
    animate(dot3, 300).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#94A3B8', marginHorizontal: 2,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingWrap}>
      <View style={styles.typingBubble}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  );
};

// ─── Main Chat Room ───

export default function ChatRoom() {
  const { id } = useLocalSearchParams();
  const roomId = id as string;
  const router = useRouter();

  const { token, user } = useAuthStore();
  const {
    connect, disconnect, sendMessage, addReaction, messages,
    fetchMessages, chats, typingUsers, sendTypingStatus, markMessagesAsRead,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMsgForReaction, setSelectedMsgForReaction] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  // Voice recording (Temporarily disabled for Expo Go)
  const recorder = null;
  const recorderState = { isRecording: false, durationMillis: 0 };
  const isRecording = false;
  const recordingDuration = 0;
  const recordPulse = useRef(new Animated.Value(1)).current;

  const sendBtnScale = useRef(new Animated.Value(0)).current;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentMessages = messages[roomId] || [];
  const roomTypingUsers = typingUsers[roomId] || [];
  const othersTyping = roomTypingUsers.filter(uid => Number(uid) !== Number(user?.id));

  const chatDetail = chats.find(c => c.id.toString() === roomId);
  const chatAvatar = chatDetail?.avatar || `https://i.pravatar.cc/150?u=${roomId}`;
  const chatName = chatDetail?.name || 'NexTalk User';
  const isGroup = chatDetail?.isGroup || false;
  const isOnline = chatDetail?.online || false;

  useEffect(() => {
    if (token) {
      connect(token);
      fetchMessages(roomId);
      markMessagesAsRead(roomId);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(roomId, false);
    };
  }, [roomId]);

  useEffect(() => {
    Animated.spring(sendBtnScale, {
      toValue: inputText.trim() ? 1 : 0,
      useNativeDriver: true,
      friction: 6, tension: 50,
    }).start();
  }, [inputText]);

  // Build message list with date separators
  const processedMessages = (() => {
    const result: MessageOrDate[] = [];
    currentMessages.forEach((msg, idx) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const nextMsg = currentMessages[idx + 1];
      const nextMsgDate = nextMsg ? new Date(nextMsg.createdAt).toDateString() : '';
      result.push(msg);
      if (msgDate !== nextMsgDate) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const label = msgDate === today ? 'Today'
          : msgDate === yesterday ? 'Yesterday'
          : new Date(msg.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
        result.push({ type: 'date', date: label, id: `date-${msg.id}` });
      }
    });
    return result;
  })();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(uri, 'chats');
      const { ws } = useChatStore.getState();
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'send_message', payload: { chat_id: parseInt(roomId, 10), content: url, type: 'image' } }));
      }
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text) {
      sendTypingStatus(roomId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTypingStatus(roomId, false), 2000);
    } else {
      sendTypingStatus(roomId, false);
    }
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(roomId, inputText.trim());
      setInputText('');
      sendTypingStatus(roomId, false);
    }
  };

  const hasText = inputText.trim().length > 0;

  // ─── Voice Recording ───

  const startRecording = async () => {
    /* Disabled for Expo Go compatibility
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      recorder.record();
      ...
    } catch (err) {
      console.error('Recording start error:', err);
    }
    */
  };

  const cancelRecording = async () => {
    /* Temporarily disabled for Expo Go
    try {
      await recorder?.stop();
    } catch (err) {
      console.error(err);
    }
    */
    recordPulse.stopAnimation();
  };
  const sendVoiceMessage = async () => {
    /* Temporarily disabled for Expo Go 
    try {
      await recorder?.stop();
      recordPulse.stopAnimation();

      const uri = recorder?.uri;
      if (!uri) return;

      setIsUploading(true);
      const audioUrl = await uploadAudioToCloudinary(uri, 'voice');
      setIsUploading(false);

      const { ws } = useChatStore.getState();
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'send_message',
          payload: {
            chat_id: parseInt(roomId, 10),
            content: audioUrl,
            type: 'voice',
          }
        }));
      }
    } catch (err) {
      console.error('Voice send error:', err);
      setIsUploading(false);
    }
    */
  };

  const formatRecordTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ─── Render ───

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Elegant background */}
      <View style={styles.bgLayer} />

      {/* ─── Custom header ─── */}
      <View style={styles.headerOuter}>
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerInner}>
            {/* Left: Back + Profile */}
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
                <ChevronLeft color="#0F172A" size={26} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => isGroup && router.push(`/chat/info/${roomId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: chatAvatar }} style={styles.headerAvatar} />
                  {!isGroup && isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
                  {othersTyping.length > 0 ? (
                    <Text style={styles.typingLabel}>typing...</Text>
                  ) : (
                    <Text style={styles.statusLabel}>
                      {isGroup ? `Group · ${chatDetail ? 'tap for info' : ''}` : isOnline ? 'Online' : 'Offline'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Right: Action icons */}
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Video color="#475569" size={21} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Phone color="#475569" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── Messages ─── */}
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          data={processedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            if ('date' in item && item.type === 'date') {
              return (
                <View style={styles.dateSepWrap}>
                  <View style={styles.datePill}>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
              );
            }
            const msg = item as ChatMessage;
            const prevItem = processedMessages[index + 1];
            const nextItem = processedMessages[index - 1];
            const isFirst = !prevItem || (prevItem as any).senderId !== msg.senderId || (prevItem as any).type === 'date';
            const isLast = !nextItem || (nextItem as any).senderId !== msg.senderId || (nextItem as any).type === 'date';
            return (
              <MessageBubble
                msg={msg}
                isMine={Number(msg.senderId) === Number(user?.id)}
                isRead={msg.status === 'read'}
                isImage={msg.type === 'image' || msg.type === 'voice'}
                isFirstInGroup={isFirst}
                isLastInGroup={isLast}
                onLongPress={setSelectedMsgForReaction}
              />
            );
          }}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={othersTyping.length > 0 ? <TypingIndicator /> : null}
        />

        {/* Upload indicator */}
        {isUploading && (
          <View style={styles.uploadBar}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadText}>{isRecording ? 'Sending voice...' : 'Sending image...'}</Text>
          </View>
        )}

        {/* ─── Input Bar ─── */}
        {isRecording ? (
          /* Recording Mode */
          <View style={styles.inputOuter}>
            <View style={styles.recordingRow}>
              <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn} activeOpacity={0.7}>
                <Trash2 color="#EF4444" size={20} />
              </TouchableOpacity>

              <View style={styles.recordInfoCenter}>
                <Animated.View style={[styles.recordDotPulse, { transform: [{ scale: recordPulse }] }]}>
                  <View style={styles.recordDot} />
                </Animated.View>
                <Text style={styles.recordTimer}>{formatRecordTime(recordingDuration)}</Text>
                <Text style={styles.recordLabel}>Recording...</Text>
              </View>

              <TouchableOpacity onPress={sendVoiceMessage} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.sendBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Send color="#FFF" size={19} style={{ marginLeft: 2 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Normal Input Mode */
          <View style={[styles.inputOuter, inputFocused && styles.inputOuterFocused]}>
            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.inputIcon} activeOpacity={0.6}>
                <Smile color="#94A3B8" size={24} />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleTextChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                multiline
                maxLength={2000}
              />

              {!hasText && (
                <>
                  <TouchableOpacity style={styles.inputIcon} onPress={handlePickImage} activeOpacity={0.6}>
                    <Paperclip color="#94A3B8" size={21} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputIcon} activeOpacity={0.6}>
                    <Camera color="#94A3B8" size={21} />
                  </TouchableOpacity>
                </>
              )}

              {hasText ? (
                <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
                  <TouchableOpacity onPress={handleSend} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#6366F1', '#4F46E5']}
                      style={styles.sendBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Send color="#FFF" size={19} style={{ marginLeft: 2 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity onPress={startRecording} activeOpacity={0.8}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.sendBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Mic color="#FFF" size={20} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── Reaction Picker Modal ─── */}
      <Modal transparent visible={!!selectedMsgForReaction} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedMsgForReaction(null)}>
          <View style={styles.reactionPicker}>
            {['❤️', '👍', '😂', '😮', '😢', '🔥'].map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionItem}
                onPress={() => {
                  if (selectedMsgForReaction) addReaction(roomId, selectedMsgForReaction, emoji);
                  setSelectedMsgForReaction(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───

const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 90;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  flex1: { flex: 1 },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F4F6FA',
  },

  // ── Header ──
  headerOuter: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 28,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 6,
  },
  avatarWrap: {
    position: 'relative',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  headerTextCol: {
    marginLeft: 11,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  typingLabel: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
  },

  // ── Messages ──
  messageList: {
    paddingHorizontal: 16,
    paddingTop: HEADER_HEIGHT + 6,
    paddingBottom: 6,
  },
  msgRow: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  imgBubble: {
    padding: 3,
    overflow: 'hidden',
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  msgText: {
    fontSize: 15.5,
    lineHeight: 22,
  },
  msgTextMine: {
    color: '#FFFFFF',
  },
  msgTextOther: {
    color: '#1E293B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  timeMine: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  timeOther: {
    fontSize: 10,
    color: '#B0B8C4',
    fontWeight: '600',
  },
  imgContent: {
    width: 240,
    height: 180,
    borderRadius: 14,
  },
  imgTimeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  imgTimeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },

  // ── Reactions ──
  reacBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 2,
  },
  reacCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  // ── Typing Indicator ──
  typingWrap: {
    paddingLeft: 4,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    alignSelf: 'flex-start',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  // ── Date separators ──
  dateSepWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Upload bar ──
  uploadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  uploadText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Input bar ──
  inputOuter: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(226, 232, 240, 0.6)',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingHorizontal: 12,
  },
  inputOuterFocused: {
    borderTopColor: 'rgba(99, 102, 241, 0.15)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    maxHeight: 120,
    paddingHorizontal: 6,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Reaction Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    gap: 2,
  },
  reactionItem: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 28,
  },

  // ── Voice Message Styles ──
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    gap: 2,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 30,
  },

  // ── Recording UI Styles ──
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    height: 48,
  },
  recordCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfoCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDotPulse: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordTimer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  recordLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
