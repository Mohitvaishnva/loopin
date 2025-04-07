import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, push, set, serverTimestamp, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const AppPost = ({ navigation }) => {
  const [postText, setPostText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    profilePic: 'https://via.placeholder.com/100'
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = getAuth();
  const database = getDatabase();
  const storage = getStorage();
  
  useEffect(() => {
    // Request permission for image library on component mount
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images!');
      }
    })();
    
    // Get current user data from Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
      setIsLoading(true);
      
      const userRef = ref(database, `users/${currentUser.uid}`);
      
      try {
        const unsubscribe = onValue(userRef, (snapshot) => {
          setIsLoading(false);
          const data = snapshot.val();
          if (data) {
            console.log("Retrieved user data:", data); // For debugging
            setUserData({
              name: data.name || 'Anonymous User',
              profilePic: data.profilePic || 'https://via.placeholder.com/100'
            });
          } else {
            console.log("No user data found");
            setUserData({
              name: 'Anonymous User',
              profilePic: 'https://via.placeholder.com/100'
            });
          }
        }, (error) => {
          setIsLoading(false);
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to load user data");
        });
        
        // Cleanup listener on unmount
        return () => unsubscribe();
      } catch (error) {
        setIsLoading(false);
        console.error("Error setting up data listener:", error);
      }
    } else {
      setIsLoading(false);
      console.log("No user is signed in");
      Alert.alert("Error", "You must be logged in to create a post", [
        { text: "OK", onPress: () => navigation.navigate('LoginScreen') }
      ]);
    }
  }, []);
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  const handleSelectImage = async () => {
    try {
      // Launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'There was an error selecting the image');
    }
  };
  
  const handleRemoveImage = () => {
    setAttachedImage(null);
  };
  
  // Function to upload image to Firebase Storage
  const uploadImage = async (uri) => {
    try {
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a storage reference
      const fileName = `post_images/${auth.currentUser.uid}_${new Date().getTime()}`;
      const imageRef = storageRef(storage, fileName);
      
      // Upload the file
      await uploadBytes(imageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };
  
  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert("Error", "Please enter some text for your post");
      return;
    }
    
    try {
      // Show loading state
      setIsLoading(true);
      
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to post");
        setIsLoading(false);
        return;
      }
      
      let imageUrl = null;
      
      // Upload image if attached
      if (attachedImage) {
        imageUrl = await uploadImage(attachedImage);
      }
      
      // Create a new post reference
      const postsRef = ref(database, 'posts');
      const newPostRef = push(postsRef);
      
      // Post data
      const postData = {
        uid: user.uid,
        userName: userData.name,
        text: postText,
        imageUrl: imageUrl,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0
      };
      
      // Save post data
      await set(newPostRef, postData);
      
      // Also save to user's posts collection for easy retrieval
      const userPostRef = ref(database, `users/${user.uid}/posts/${newPostRef.key}`);
      await set(userPostRef, true);
      
      // Reset form after posting
      setIsLoading(false);
      Alert.alert("Success", "Post submitted successfully!");
      setPostText('');
      setAttachedImage(null); 
      
      // Navigate back to the feed
      navigation.navigate('Community');
      
    } catch (error) {
      setIsLoading(false);
      console.error('Error posting:', error);
      Alert.alert("Error", "There was an error creating your post. Please try again.");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a80f5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={{width: 24}} />
        </View>
        
        <View style={styles.userInfoContainer}>
          <Image 
            source={{uri: userData.profilePic}} 
            style={styles.profilePic} 
          />
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{userData.name}</Text>
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.postInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            multiline
            value={postText}
            onChangeText={setPostText}
          />
        </View>
        
        {attachedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{uri: attachedImage}} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
              <Ionicons name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.attachmentsBar}>
          <Text style={styles.attachmentsLabel}>Add to your post:</Text>
          <TouchableOpacity 
            style={styles.uploadImageBtn} 
            onPress={handleSelectImage}
          >
            <Ionicons name="image" size={22} color="#4CAF50" />
            <Text style={styles.uploadImageText}>Upload a Pic</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.postButton, 
            (!postText.trim() || isLoading) && styles.disabledButton
          ]} 
          onPress={handlePost}
          disabled={!postText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView}>
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userNameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  postInput: {
    fontSize: 18,
    color: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    margin: 15,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  attachmentsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  attachmentsLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 8,
    borderRadius: 4,
  },
  uploadImageText: {
    color: '#fff',
    marginLeft: 8,
  },
  postButton: {
    backgroundColor: '#4a80f5',
    borderRadius: 5,
    paddingVertical: 12,
    marginHorizontal: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#364e84',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AppPost;