import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, StatusBar, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Shield, Zap, Users, ArrowRight, ChevronRight, Globe, Lock, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    icon: <Globe color="#FFF" size={36} strokeWidth={2} />,
    iconBg: ['#6366F1', '#4F46E5'],
    title: 'Connect with\nEveryone',
    subtitle: 'Stay connected with friends and colleagues around the globe with high-speed messaging.',
    decorColor: 'rgba(99, 102, 241, 0.08)',
  },
  {
    id: 2,
    icon: <Lock color="#FFF" size={36} strokeWidth={2} />,
    iconBg: ['#4F46E5', '#8B5CF6'],
    title: 'Privacy by\nDesign',
    subtitle: 'Your security is our priority. Every message is protected by military-grade encryption.',
    decorColor: 'rgba(79, 70, 229, 0.08)',
  },
  {
    id: 3,
    icon: <Sparkles color="#FFF" size={36} strokeWidth={2} />,
    iconBg: ['#8B5CF6', '#7C3AED'],
    title: 'Smart AI\nCompanion',
    subtitle: 'Enhance your conversations with NexBot — our advanced AI assistant powered by Gemini.',
    decorColor: 'rgba(139, 92, 246, 0.08)',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  const animateTransition = (newIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40, duration: 200, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(newIndex);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 40 }),
        Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 50 }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      animateTransition(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(auth)/login');
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(auth)/login');
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E0E7FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative background glass elements */}
      <View style={[styles.decoCircleLarge, { backgroundColor: slide.decorColor }]} />
      <View style={[styles.decoCircleSmall, { backgroundColor: slide.decorColor }]} />

      {/* Skip */}
      <TouchableOpacity 
        style={styles.skipBtn} 
        onPress={handleSkip} 
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={[styles.iconArea, { transform: [{ scale: iconScale }] }]}>
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingMiddle}>
              <View style={styles.iconRingInner}>
                <LinearGradient
                  colors={slide.iconBg as any}
                  style={styles.iconCircle}
                >
                  {slide.icon}
                </LinearGradient>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
        </Animated.View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomArea}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dotContainer]}>
              <Animated.View 
                style={[
                  styles.dot, 
                  i === currentSlide ? styles.dotActive : { backgroundColor: '#CBD5E1' }
                ]} 
              />
            </View>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.9} style={styles.nextBtnWrap}>
          <LinearGradient
            colors={slide.iconBg as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextBtnText}>{isLast ? 'Get Started' : 'Continue'}</Text>
            {isLast ? (
              <ArrowRight color="#FFF" size={20} strokeWidth={2.5} style={{ marginLeft: 10 }} />
            ) : (
              <ChevronRight color="#FFF" size={20} strokeWidth={2.5} style={{ marginLeft: 6 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Page indicator */}
        <Text style={styles.pageIndicator}>STEP {currentSlide + 1} OF {SLIDES.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Decorative
  decoCircleLarge: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.6,
  },
  decoCircleSmall: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.4,
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  iconArea: {
    marginBottom: 60,
  },
  iconRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  iconRingMiddle: {
    width: 144,
    height: 144,
    borderRadius: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconRingInner: {
    width: 110,
    height: 110,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  textArea: {
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 44,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },

  // Bottom
  bottomArea: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  dotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 32,
    height: 8,
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  nextBtnWrap: {
    width: '100%',
    marginBottom: 24,
  },
  nextBtn: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pageIndicator: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 2,
    opacity: 0.6,
  },
});
