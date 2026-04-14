import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Keyboard, StatusBar, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { Sparkles, Send, Mic, Paperclip, Bot } from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/Colors';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { Config } from '../../constants/Config';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';


const SUGGESTED_PROMPTS = [
  "Summarize my unread messages",
  "Write a polite rejection email",
  "Explain quantum computing",
  "Translate 'Hello' to Japanese"
];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function NexBotScreen() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm NexBot, your personal AI assistant. How can I help you today?", isUser: false }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const token = useAuthStore(state => state.token);

  // Animation for the Bot Avatar Glow (Standard Animated API for Expo Go stability)
  const glow = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glow]);

  const glowStyle = {
    transform: [{ scale: glow }],
    opacity: glow.interpolate({
      inputRange: [1, 1.2],
      outputRange: [0.3, 0.7],
    }),
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isTyping) return;
    
    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    Keyboard.dismiss();
    setIsTyping(true);

    try {
      const response = await axios.post(
        `${Config.API_URL}/nexbot/ask`, 
        { prompt: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response.data.reply, 
        isUser: false 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        isUser: false
      };
      setMessages(prev => [...prev, errorMsg]);
      console.log('NexBot Error:', error.response?.data || error.message);
    } finally {
      setIsTyping(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Premium Glass Header */}
      <View style={styles.headerOuter}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.headerRow}>
            <View style={styles.avatarContainer}>
              <Animated.View style={[styles.glowRing, glowStyle]} />
              <LinearGradient
                colors={['#A855F7', '#6366F1']}
                style={styles.headerAvatar}
              >
                <Bot color="#FFF" size={26} />
              </LinearGradient>
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>NexBot AI</Text>
              <Text style={styles.headerSubtitle}>Always next to you ✨</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea} 
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.bubbleWrapper, msg.isUser ? styles.wrapperUser : styles.wrapperBot]}>
              {!msg.isUser && (
                <View style={styles.botIconSmall}>
                  <Sparkles color="#A855F7" size={14} />
                </View>
              )}
              {msg.isUser ? (
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.bubbleUser]}
                >
                  <Text style={[styles.messageText, styles.textUser]}>{msg.text}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.bubble, styles.bubbleBot]}>
                  <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                  <Text style={[styles.messageText, styles.textBot]}>{msg.text}</Text>
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.bubbleWrapper, styles.wrapperBot]}>
              <View style={styles.botIconSmall}>
                <Sparkles color="#A855F7" size={14} />
              </View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={[styles.messageText, styles.textBot, { fontStyle: 'italic', opacity: 0.6 }]}>
                  NexBot is thinking...
                </Text>
              </View>
            </View>
          )}

          {/* Suggestions */}
          {messages.length === 1 && (
            <View style={styles.suggestionContainer}>
              <Text style={styles.suggestionLabel}>Popular Requests</Text>
              <View style={styles.promptList}>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.promptBtn}
                    onPress={() => handleSend(prompt)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,1)', 'rgba(248,250,252,1)']}
                      style={styles.promptInner}
                    >
                      <Sparkles color="#A855F7" size={14} style={{ marginRight: 8 }} />
                      <Text style={styles.promptText}>{prompt}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating AI Input Bar */}
        <View style={styles.floatingInputWrapper}>
          <BlurView intensity={60} tint="light" style={styles.inputGlass}>
            <View style={styles.inputInner}>
              <TouchableOpacity style={styles.inputAction}>
                <Paperclip color="#64748B" size={20} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              
              {inputText.trim() ? (
                <TouchableOpacity onPress={() => handleSend()}>
                  <LinearGradient
                    colors={['#A855F7', '#7C3AED']}
                    style={styles.sendIconBtn}
                  >
                    <Send color="#FFF" size={16} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.inputAction}>
                  <Mic color="#64748B" size={20} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  headerOuter: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
  },
  headerSafe: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  glowRing: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 28,
    backgroundColor: '#A855F7',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.premium,
  },
  onlineBadge: {
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A855F7',
    fontWeight: '700',
    marginTop: 1,
  },

  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingTop: 130, // Clear header
    paddingHorizontal: 20,
    paddingBottom: 160, // Clear input bar + tab bar
  },

  // Bubbles
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperBot: {
    justifyContent: 'flex-start',
  },
  botIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.premium,
    shadowOpacity: 0.05,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  textUser: {
    color: '#FFF',
  },
  textBot: {
    color: '#1E293B',
  },

  // Suggestions
  suggestionContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptList: {
    width: '100%',
    gap: 12,
  },
  promptBtn: {
    width: '100%',
    ...Shadows.premium,
    shadowOpacity: 0.03,
  },
  promptInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  promptText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '700',
  },

  // Floating Input
  floatingInputWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 90, // Significant offset for Tab Bar
    left: 20,
    right: 20,
    zIndex: 100,
  },
  inputGlass: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Shadows.premium,
    shadowOpacity: 0.08,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  inputAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    fontSize: 16,
    color: '#1E293B',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  sendIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  }
});
