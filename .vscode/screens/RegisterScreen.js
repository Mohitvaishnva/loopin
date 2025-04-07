import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';  // Import database functions
import { app } from '../firebase';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [confirmSecureEntry, setConfirmSecureEntry] = useState(true);
  
  const navigation = useNavigation();
  const auth = getAuth(app);
  const database = getDatabase(app);  // Initialize the database

  const validateForm = () => {
    setError(''); // Clear previous errors
    
    if (!name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Function to save user data to Realtime Database
  const saveUserToDatabase = (userId, userData) => {
    // Create reference to users/userId in the database
    const userRef = ref(database, 'users/' + userId);
    
    // Set user data at the specified reference
    return set(userRef, userData);
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user data to the Realtime Database
      await saveUserToDatabase(user.uid, {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
      
      // Registration successful - navigate to home
      navigation.replace('HomeScreen');
      
    } catch (error) {
      console.log("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please sign in or use a different email.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is invalid.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled.";
          break;
        default:
          errorMessage = "An unexpected error occurred. Please try again.";
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.logoText}>LoopIn</Text>
              <Text style={styles.welcomeText}>Create your account</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={18} color="#FF3B30" style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Registration Form */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#888"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => this.emailInput?.focus()}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  ref={(input) => { this.emailInput = input; }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => this.passwordInput?.focus()}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    ref={(input) => { this.passwordInput = input; }}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureEntry}
                    placeholder="••••••••••••"
                    placeholderTextColor="#888"
                    returnKeyType="next"
                    onSubmitEditing={() => this.confirmPasswordInput?.focus()}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setSecureEntry(!secureEntry)}
                  >
                    <Ionicons 
                      name={secureEntry ? "eye-off" : "eye"} 
                      size={20} 
                      color="#888" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    ref={(input) => { this.confirmPasswordInput = input; }}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={confirmSecureEntry}
                    placeholder="••••••••••••"
                    placeholderTextColor="#888"
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setConfirmSecureEntry(!confirmSecureEntry)}
                  >
                    <Ionicons 
                      name={confirmSecureEntry ? "eye-off" : "eye"} 
                      size={20} 
                      color="#888" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.passwordHint}>
                Password must be at least 8 characters long
              </Text>

              {/* Sign Up Button */}
              <TouchableOpacity 
                style={[
                  styles.signUpButton, 
                  (loading || !name || !email || !password || !confirmPassword) && styles.disabledButton
                ]}
                onPress={handleSignUp}
                disabled={loading || !name || !email || !password || !confirmPassword}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Sign In Option */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.signInLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Forgot Password Option (shown only when email exists) */}
            {error?.includes('already registered') && (
              <TouchableOpacity 
                style={styles.forgotPasswordLink}
                onPress={() => navigation.navigate('ForgotPassword', { email })}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 32 : 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#888',
    fontSize: Platform.OS === 'ios' ? 16 : 15,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    flex: 1,
  },
  errorIcon: {
    marginRight: 8,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 16 : 14,
    color: '#fff',
    fontSize: 16,
    height: Platform.OS === 'ios' ? 52 : 50,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    height: Platform.OS === 'ios' ? 52 : 50,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: Platform.OS === 'ios' ? 16 : 14,
    height: '100%',
  },
  eyeIcon: {
    padding: 16,
  },
  passwordHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  signUpButton: {
    backgroundColor: '#FF7959',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: Platform.OS === 'ios' ? 52 : 50,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signInText: {
    color: '#888',
    fontSize: 14,
  },
  signInLinkText: {
    color: '#FF7959',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    marginTop: 10,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#FF7959',
    fontSize: 14,
  },
});

export default RegisterScreen;