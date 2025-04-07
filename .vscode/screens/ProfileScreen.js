import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Get auth and database references
  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();

  useEffect(() => {
    // Check if a user is logged in
    const user = auth.currentUser;
    
    if (user) {
      // Create a reference to the user's data location
      const userRef = ref(database, 'users/' + user.uid);
      
      // Set up listener for user data
      const unsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData({
            uid: user.uid,
            name: data.name || 'User',
            email: data.email || user.email,
            profileImage: data.profileImage || 'https://via.placeholder.com/150',
            memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'March 2023'
          });
        } else {
          // If no data exists yet in the database
          setUserData({
            uid: user.uid,
            name: 'User',
            email: user.email,
            profileImage: 'https://via.placeholder.com/150',
            memberSince: 'New Member'
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
      
      // Clean up subscription
      return () => unsubscribe();
    } else {
      // No user is signed in
      setLoading(false);
    }
  }, []);

  // Request permission for image library
  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
          return false;
        }
        return true;
      } catch (err) {
        console.error("Error requesting permissions:", err);
        return false;
      }
    }
    return true;
  };

  // Function to upload image to Firebase Storage
  const uploadImageAsync = async (uri) => {
    const user = auth.currentUser;
    if (!user) return null;
  
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a storage path that matches your security rules
      const filename = `${Date.now()}.jpg`;
      const imageRef = storageRef(storage, `users/${user.uid}/profile_images/${filename}`);
      
      // Upload blob
      await uploadBytes(imageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Upload failed", "Sorry, we couldn't upload your photo. Please try again.");
      return null;  
    }
  };

  // Update profile photo in database
  const updateProfilePhoto = async (photoUrl) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, 'users/' + user.uid);
      try {
        await update(userRef, {
          profileImage: photoUrl
        });
        return true;
      } catch (error) {
        console.error("Error updating profile photo in database:", error);
        return false;
      }
    }
    return false;
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      console.log("Launching image picker...");
      
      // Use the original MediaTypeOptions that was working before
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log("Image picker result:", result);

      if (!result.canceled) {
        // Handle both newer and older API responses
        if (result.assets && result.assets.length > 0) {
          handleSelectedImage(result.assets[0].uri);
        } else if (result.uri) {
          // Fallback for older versions of ImagePicker
          handleSelectedImage(result.uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  // Handle selected image
  const handleSelectedImage = async (imageUri) => {
    console.log("Handling selected image:", imageUri);
    setUploadingImage(true);
    
    try {
      // Upload image to Firebase Storage
      const downloadURL = await uploadImageAsync(imageUri);
      
      if (downloadURL) {
        // Update profile photo in database
        const updated = await updateProfilePhoto(downloadURL);
        if (updated) {
          // setUserData is not needed as the realtime listener will update automatically
          Alert.alert("Success", "Profile photo updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error handling selected image:", error);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Show image picker options
  const showImagePickerOptions = () => {
    console.log("Showing image picker options");
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Choose from Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Handle logout
  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        // Navigate to login screen (replace with your navigation method)
        console.log('User signed out');
        // navigation.replace('LoginScreen'); // Uncomment if using navigation
      })
      .catch(error => {
        console.error('Error signing out:', error);
      });
  };

  // Sections for settings
  const renderSettingItem = (icon, title, action, rightIcon = true) => (
    <TouchableOpacity 
      style={[styles.settingItem]} 
      onPress={typeof action === 'function' ? action : null}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={22} color="#e0e0e0" style={styles.settingIcon} />
        <Text style={styles.settingText}>{title}</Text>
      </View>
      {rightIcon && <Ionicons name="chevron-forward" size={22} color="#777" />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6c9fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {uploadingImage ? (
              <View style={[styles.profileImage, styles.loadingImageContainer]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <Image 
                source={{ uri: userData?.profileImage }} 
                style={styles.profileImage} 
              />
            )}
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={showImagePickerOptions}
              disabled={uploadingImage}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userData?.name}</Text>
            <Text style={styles.userEmail}>{userData?.email}</Text>
            <Text style={styles.userMeta}>Member since {userData?.memberSince}</Text>
          </View>
        </View>

        {/* Help & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Legal</Text>
          <View style={styles.sectionContent}>
            {renderSettingItem('help-circle', 'Help', () => console.log('Help'))}
            {renderSettingItem('document-text', 'Policies', () => console.log('Policies'))}
            {renderSettingItem('warning', 'Report Problem', () => console.log('Report problem'))}
            {renderSettingItem('shield-checkmark', 'Privacy Settings', () => console.log('Privacy'))}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            {renderSettingItem('log-out', 'Logout', handleLogout, false)}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 2.4.1</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for the safe area
  },
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e', // Dark card background
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 18,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  loadingImageContainer: {
    backgroundColor: '#6c9fff', // A more neon blue for dark mode
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6c9fff', // Matching blue
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e1e1e', // Match with card background
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#ffffff', // White text
  },
  userEmail: {
    fontSize: 15,
    marginBottom: 8,
    color: '#b3b3b3', // Light gray
  },
  userMeta: {
    fontSize: 13,
    color: '#888888', // Medium gray
  },
  section: {
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    color: '#dddddd', // Light gray text
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#1e1e1e', // Dark card background
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333', // Darker line separator
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 14,
  },
  settingText: {
    fontSize: 16,
    color: '#e0e0e0', // Light text
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#777777', // Medium gray
  }
});

export default ProfileScreen;