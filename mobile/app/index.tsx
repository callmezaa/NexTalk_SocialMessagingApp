import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Index() {
  const token = useAuthStore(state => state.token);
  const hydrate = useAuthStore(state => state.hydrate);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const init = async () => {
      await hydrate();
      setIsReady(true);
    };
    init();

    // Entrance animations
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Ring pulse
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1.6, duration: 600, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0.4, duration: 200, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
      // Brand text slides up
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Tagline
      Animated.timing(tagOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const navigate = async () => {
      // Wait for splash animations to complete and stay visible for a premium feel
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Fade out the splash screen smoothly
      Animated.timing(fadeOut, { toValue: 0, duration: 600, useNativeDriver: true }).start(async () => {
        if (token) {
          router.replace('/(tabs)');
        } else {
          try {
            const hasOnboarded = await AsyncStorage.getItem('hasOnboarded_v2');
            if (hasOnboarded === 'true') {
              router.replace('/(auth)/login');
            } else {
              router.replace('/(auth)/onboarding');
            }
          } catch (e) {
            router.replace('/(auth)/onboarding');
          }
        }
      });
    };

    navigate();
  }, [isReady, token]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4338CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative elements */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <View style={styles.deco3} />

      <View style={styles.center}>
        {/* Pulse ring */}
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
        
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <LinearGradient
            colors={['#6366F1', '#818CF8']}
            style={styles.logoGradient}
          >
            <MessageCircle color="#FFF" size={40} strokeWidth={2} />
          </LinearGradient>
        </Animated.View>

        {/* Brand Name */}
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
          <Text style={styles.brandName}>NexTalk</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: tagOpacity }}>
          <Text style={styles.tagline}>Connect Beyond Words</Text>
        </Animated.View>
      </View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottomBrand, { opacity: tagOpacity }]}>
        <Text style={styles.bottomText}>Premium Messaging</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(129, 140, 248, 0.5)',
  },
  logoWrap: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(199, 210, 254, 0.7)',
    letterSpacing: 0.5,
  },

  // Decorative circles
  deco1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  deco2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
  },
  deco3: {
    position: 'absolute',
    top: '40%',
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },

  bottomBrand: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(199, 210, 254, 0.4)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
