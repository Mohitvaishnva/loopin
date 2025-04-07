import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  Easing,
  Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, push, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const { width, height } = Dimensions.get('window');

const AddComplaintScreen = ({ navigation }) => {
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // References for form field focus
  const addressInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Firebase references
  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    // Update progress bar animation based on form completion
    const filledFields = [title, address, description, capturedMedia].filter(Boolean).length;
    const totalFields = 4;
    const progress = filledFields / totalFields;
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [title, address, description, capturedMedia]);

  const focusNextInput = (nextRef) => {
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      inputFocusAnim.setValue(0);
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    });
  };

  const clearMedia = () => {
    // Adding a little animation before clearing
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCapturedMedia(null);
      setMediaType(null);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  };

  // Updated function to handle Firebase Storage permissions error
  const uploadMediaToFirebase = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExtension = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExtension}`;
      
      // Use a different storage path - store directly in 'complaints' without user-specific subfolder
      // This is a temporary solution until proper Firebase storage rules are set up
      const mediaStorageRef = storageRef(storage, `complaints/${fileName}`);
      
      await uploadBytes(mediaStorageRef, blob);
      const downloadURL = await getDownloadURL(mediaStorageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading media:", error);
      
      // Handle storage permission error
      if (error.code === 'storage/unauthorized') {
        // Fallback: Save the complaint without media for now
        Alert.alert(
          'Media Upload Error',
          'Unable to upload media due to permission issues. Your complaint will be submitted without media attachment.',
          [{ text: 'OK' }]
        );
        return null;
      }
      
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Validate form fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your complaint');
      return;
    }
    
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Animated submission process
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        })
      ]).start();
      
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      // Upload media if exists
      let mediaURL = null;
      if (capturedMedia) {
        try {
          mediaURL = await uploadMediaToFirebase(capturedMedia);
        } catch (uploadError) {
          console.error("Media upload failed, continuing without media:", uploadError);
          // Continue with submission without the media
        }
      }
      
      // Create new complaint reference
      const complaintsRef = ref(database, `users/${currentUser.uid}/complaints`);
      const newComplaintRef = push(complaintsRef);
      
      // Prepare complaint data
      const complaintData = {
        title: title.trim(),
        address: address.trim(),
        description: description.trim(),
        mediaURL: mediaURL,
        mediaType: mediaType, // Make sure this is included
        createdAt: new Date().toISOString(),
        status: 'new',
        userId: currentUser.uid // Add userId for easier reference
      };
      
      // Save to Firebase
      await set(newComplaintRef, complaintData);
      
      Alert.alert(
        'Success', 
        'Your complaint has been submitted successfully and is being reviewed.',
        [{ text: 'OK', onPress: () => {
          resetForm();
          navigation.goBack(); // Optional: Navigate back to the complaints list
        }}]
      ); 
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    // Animate form reset
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    setTitle('');
    setAddress('');
    setDescription('');
    setCapturedMedia(null);
    setMediaType(null);
    setCurrentStep(0);
  };
  
  // Updated method to use the new ImagePicker API
  const handlePickImage = async () => {
    try {
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      // Using updated API - fix for the deprecated warning
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'], // Updated from ImagePicker.MediaTypeOptions.All
        allowsEditing: true,
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Animate new media appearance
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        ]).start();
        
        setCapturedMedia(result.assets[0].uri);
        setMediaType(result.assets[0].type === 'video' ? 'video' : 'photo');
      }
    } catch (error) {
      console.log('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select from gallery');
    }
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });
    
    return (
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressFill,
            { width: progressWidth }
          ]}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View 
            style={[
              styles.headerContainer, 
              { 
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
                opacity: fadeAnim 
              }
            ]}
          >
            <Text style={styles.heading}>Add New Complaint</Text>
            {renderProgressBar()}
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.complaintForm,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ],
                opacity: fadeAnim 
              }
            ]}
          >
            {/* Title Input */}
            <Text style={styles.sectionTitle}>Title</Text>
            <Animated.View 
              style={[
                styles.inputWrapper,
                { 
                  transform: [{ scale: inputFocusAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.02, 1]
                  }) }] 
                }
              ]}
            >
              <Ionicons name="alert-circle-outline" size={20} color="white" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter complaint title"
                placeholderTextColor="#717585"
                value={title}
                onChangeText={setTitle}
                onSubmitEditing={() => focusNextInput(addressInputRef)}
                returnKeyType="next"
              />
            </Animated.View>
            
            {/* Address Input */}
            <Text style={styles.sectionTitle}>Address</Text>
            <Animated.View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="white" style={styles.inputIcon} />
              <TextInput
                ref={addressInputRef}
                style={styles.textInput}
                placeholder="Enter address of the issue"
                placeholderTextColor="#717585"
                value={address}
                onChangeText={setAddress}
                onSubmitEditing={() => focusNextInput(descriptionInputRef)}
                returnKeyType="next"
              />
            </Animated.View>
            
            {/* Description Input */}
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="Describe your complaint in detail"
                placeholderTextColor="#717585"
                multiline={true}
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
            
            {/* Media Upload Section */}
            <Text style={styles.sectionTitle}>Evidence</Text>
            {capturedMedia ? (
              <Animated.View 
                style={[
                  styles.mediaPreview,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                {mediaType === 'photo' ? (
                  <Image source={{ uri: capturedMedia }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, styles.videoPreview]}>
                    <Ionicons name="videocam" size={50} color="#ccc" />
                    <Text style={styles.videoText}>Video Recorded</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={clearMedia}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={22} color="white" />
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity 
                  style={styles.mediaPickerButton} 
                  onPress={handlePickImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.mediaIconContainer}>
                    <Ionicons name="images-outline" size={28} color="black" />
                  </View>
                  <Text style={styles.mediaPickerText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Submit Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  isSubmitting && styles.disabledButton
                ]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="hourglass-outline" size={20} color="white" style={styles.submitIcon} />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </View>
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="send-outline" size={20} color="black" style={styles.submitIcon} />
                    <Text style={styles.submitButtonText}>Submit Complaint</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(147, 112, 219, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#282828',
    borderRadius: 2,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9370DB',
    borderRadius: 2,
  },
  complaintForm: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 14,
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  mediaPickerButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mediaIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mediaPickerText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  videoPreview: {
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#ccc',
  },
  removeButton: {
    backgroundColor: '#9370DB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    marginRight: 8,
    backgroundColor: 'black ',
  },
  submitButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default AddComplaintScreen;