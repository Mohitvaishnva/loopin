import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image,
  StatusBar,
  Animated, 
  Dimensions,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

// Get screen dimensions for responsive layout
const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
 
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const logoShine = useRef(new Animated.Value(-width)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  
  // Infinity logo animation references
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Title animation
    Animated.timing(titleFade, {
      toValue: 1,
      duration: 1800,
      delay: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(titleScale, {
      toValue: 1,
      duration: 1200,
      delay: 800,
      easing: Easing.elastic(1),
      useNativeDriver: true,
    }).start();
    
    // Shine effect animation
    Animated.loop(
      Animated.timing(logoShine, {
        toValue: width * 2,
        duration: 3000,
        delay: 500,
        useNativeDriver: true,
      })
    ).start();
    
    // Color transition animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        })
      ])
    ).start();

    // Slide up animation for buttons
    Animated.timing(translateY, {
      toValue: 0,
      duration: 1200,
      delay: 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
    
    // Infinity logo animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(strokeAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(strokeAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, []);
  
  // Animate logo color
  const logoColor = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF7D45', '#FF3D95', '#FF9505']
  });
  
  const shadowColor = colorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(255, 125, 69, 0.9)', 'rgba(255, 61, 149, 0.9)', 'rgba(255, 149, 5, 0.9)']
  });
  
  // Infinity logo animations
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const strokeColor = strokeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF7D45', '#FF3D95', '#FF9505']
  });
  
  const strokeWidth = strokeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4]
  });

  // Create the AnimatedSvg component
  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Welcome to</Text>
        </View>
        
        {/* App Name with enhanced eye-catching effects */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              { 
                opacity: titleFade, 
                transform: [{ scale: titleScale }],
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.appNameText, 
                { 
                  color: logoColor,
                  textShadowColor: shadowColor,
                }
              ]}
            >
              LoopIn
            </Animated.Text>
            
            {/* Shine effect overlay */}
            <Animated.View 
              style={[
                styles.shineEffect,
                { transform: [{ translateX: logoShine }] }
              ]}
            />
          </Animated.View>
          
          {/* Logo underline/accent */}
          <Animated.View 
            style={[
              styles.logoAccent,
              { backgroundColor: logoColor }
            ]}
          />
          
          {/* Animated Infinity Logo */}
          <Animated.View style={[
            styles.infinityLogoContainer,
            {
              transform: [
                { rotate: spin },
                { scale: pulseAnim }
              ]
            }
          ]}>
            <Svg height="50" width="70" viewBox="0 0 100 90">
              <AnimatedPath
                d="M30,30 C11,30 11,60 30,60 C49,60 49,30 30,30 M30,60 C49,60 70,30 89,30 C108,30 108,60 89,60 C70,60 49,30 30,30"
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        </View>
        
        <Animated.Text style={styles.taglineText}>
          "Raise Issues, Build Community, Drive Change!"
        </Animated.Text>
        
        {/* Bubble container without animations */}
        <View style={styles.bubbleContainer}>
          {/* Row 1: Top row with two bubbles */}
          <View style={styles.bubbleRow}>
            {/* First bubble - top left */}
            <View style={styles.bubble}>
              <Image 
                source={require('../assets/reg1.jpg')} 
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Second bubble - top right */}
            <View style={styles.bubble}>
              <Image 
                source={require('../assets/reg2.jpg')} 
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            </View>
          </View>
          
          {/* Row 2: Bottom row with two bubbles */}
          <View style={styles.bubbleRow}>
            {/* Third bubble - bottom left */}
            <View style={styles.bubble}>
              <Image 
                source={require('../assets/reg3.jpg')} 
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Fourth bubble - bottom right */}
            <View style={styles.bubble}>
              <Image 
                source={require('../assets/reg4.jpg')} 
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
        
        {/* Buttons with enhanced animations */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            { transform: [{ translateY: translateY }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('RegisterScreen')}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={styles.accountText}>I have an account</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={styles.footerText}>A civic responsibility App</Text>
      </Animated.View>
      
      <View style={styles.bottomIndicator}></View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
  },
  dateText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  userText: {
    color: '#FF7D45',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    fontWeight: '600',
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: height * 0.04,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  logoWrapper: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 10,
  },
  appNameText: {
    fontSize: 58, // Increased size
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 3, // Increased letter spacing
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 15,
    textTransform: 'uppercase', // Makes it more eye-catching
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-25deg' }],
  },
  logoAccent: {
    height: 5,
    width: 140,
    marginTop: 3,
    borderRadius: 3,
    shadowColor: '#FF7D45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  infinityLogoContainer: {
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  taglineText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold', 
    fontWeight: '600',
    letterSpacing: 0.3,
    paddingHorizontal: 10,
  },
  bubbleContainer: {
    width: '100%',
    height: height * 0.25, // Reduced height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  bubble: {
    width: width * 0.23, // SMALLER size as requested
    height: width * 0.23,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF7D45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    elevation: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bubbleImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 25,
  },
  getStartedButton: {
    backgroundColor: '#FF7D45',
    borderRadius: 50,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF7D45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    fontWeight: '700',
    letterSpacing: 0.5, 
  },
  accountButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  accountText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Montserrat-Medium',
    fontWeight: '500',
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    fontWeight: '400',
  },
  bottomIndicator: {
    width: 70,
    height: 5,
    backgroundColor: '#444',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 15,
  }
});

export default WelcomeScreen;