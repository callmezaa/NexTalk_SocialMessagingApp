import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { Lock, Mail, User as UserIcon, MessageCircle, ArrowRight, ShieldCheck, Github, Chrome as Google, Smartphone as Apple } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFocused, setIsFocused] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const registerAction = useAuthStore(state => state.registerAction);
  const isLoading = useAuthStore(state => state.isLoading);
  const router = useRouter();

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleRegister = async () => {
    setErrorMsg('');
    if (!username || !email || !password) {
      setErrorMsg('Please fill in all fields to join.');
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree to the Terms of Service.');
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const { success, error } = await registerAction(username, email, password);
    if (success) {
      router.replace('/(auth)/login');
    } else {
      setErrorMsg(error || 'Registration failed. Please try again.');
    }
  };

  const renderSocialBtn = (Icon: any, color: string) => (
    <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
      <Icon color={color} size={22} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#F8FAFC', '#EEF2FF', '#E0E7FF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative background circles */}
      <View style={styles.decoCircle1} />
      <View style={styles.decoCircle2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Area */}
            <View style={styles.headerArea}>
              <View style={styles.logoRing}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.logoBox}
                >
                  <MessageCircle color="#FFF" size={32} strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <Text style={styles.brandTitle}>NexTalk</Text>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Join thousands of users in our premium messaging network</Text>
            </View>
 
            {/* Form Area */}
            <View style={styles.formArea}>
              {errorMsg ? (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </Animated.View>
              ) : null}

              <View style={[styles.inputGroup, isFocused === 'username' && styles.inputGroupFocused]}>
                <View style={styles.iconBox}>
                  <UserIcon color={isFocused === 'username' ? '#4F46E5' : '#94A3B8'} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setIsFocused('username')}
                  onBlur={() => setIsFocused('')}
                />
              </View>

              <View style={[styles.inputGroup, isFocused === 'email' && styles.inputGroupFocused]}>
                <View style={styles.iconBox}>
                  <Mail color={isFocused === 'email' ? '#4F46E5' : '#94A3B8'} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused('')}
                />
              </View>

              <View style={[styles.inputGroup, isFocused === 'password' && styles.inputGroupFocused]}>
                <View style={styles.iconBox}>
                  <Lock color={isFocused === 'password' ? '#4F46E5' : '#94A3B8'} size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused('')}
                />
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity 
                style={styles.termsRow} 
                onPress={() => setAgreed(!agreed)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                  {agreed && <ShieldCheck color="#FFF" size={12} strokeWidth={3} />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  style={[styles.mainBtn, (isLoading || !agreed) && styles.btnDisabled]} 
                  onPress={handleRegister}
                  disabled={isLoading || !agreed}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>{isLoading ? 'Creating Account...' : 'Get Started'}</Text>
                    {!isLoading && <ArrowRight color="#FFF" size={18} style={styles.btnIcon} />}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or join with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Logins */}
              <View style={styles.socialRow}>
                {renderSocialBtn(Google, '#EA4335')}
                {renderSocialBtn(Apple, '#1F2937')}
                {renderSocialBtn(Github, '#1F2937')}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.6}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // Decorative
  decoCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(79, 70, 229, 0.03)',
  },

  // Header 
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: Platform.OS === 'ios' ? 0 : 40,
  },
  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  formArea: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroupFocused: {
    borderColor: '#4F46E5',
    shadowOpacity: 0.08,
  },
  iconBox: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    paddingRight: 20,
  },
  
  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  termsText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
  termsLink: {
    color: '#4F46E5',
    fontWeight: '700',
  },

  mainBtn: {
    width: '100%',
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  btnIcon: {
    marginLeft: 8,
  },

  // Social
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '800',
  },
});
