import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';

const ComplaintDetail = ({ route, navigation }) => {
  // Get complaint data passed from HomeScreen
  const { complaint } = route.params;
  const [detailedComplaint, setDetailedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch the most current complaint data from Firebase
    const fetchComplaintDetails = async () => {
      try {
        const database = getDatabase(app);
        const complaintRef = ref(database, `users/${complaint.userId}/complaints/${complaint.id}`);
        
        onValue(complaintRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setDetailedComplaint({
              id: complaint.id,
              ...data
            });
            setLoading(false);
          } else {
            setError('Complaint not found');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error fetching complaint details:", error);
        setError('Failed to load complaint details');
        setLoading(false);
      }
    };
    
    // Use the existing complaint data first, then fetch latest
    setDetailedComplaint(complaint);
    fetchComplaintDetails();
  }, [complaint]);
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'in-progress': return '#409eff';
      case 'resolved': return '#52c41a';
      case 'rejected': return '#f56c6c';
      case 'new':
      default: return '#9c27b0';
    }
  };
  
  const getFormattedDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Added function to render media based on mediaType
  const renderMediaItem = (item, index) => {
    // For evidence items with specific type property
    if (item.type) {
      if (item.type === 'image') {
        return (
          <Image
            source={{ uri: item.url }}
            style={styles.evidenceImage}
            defaultSource={require('../assets/reg1.jpg')}
          />
        );
      } else if (item.type === 'video') {
        return (
          <View style={styles.fileEvidence}>
            <Ionicons name="videocam-outline" size={24} color="#9370DB" />
            <Text style={styles.fileText}>Video</Text>
          </View>
        );
      }
    }
    
    // For a single mediaURL with mediaType
    if (item.url || typeof item === 'string') {
      const url = item.url || item;
      const type = item.mediaType || detailedComplaint?.mediaType;
      
      if (type === 'photo' || !type) {
        return (
          <Image
            source={{ uri: url }}
            style={styles.evidenceImage}
            defaultSource={require('../assets/reg1.jpg')}
          />
        );
      } else if (type === 'video') {
        return (
          <View style={styles.fileEvidence}>
            <Ionicons name="videocam-outline" size={24} color="#9370DB" />
            <Text style={styles.fileText}>Video Evidence</Text>
          </View>
        );
      }
    }
    
    // Default fallback
    return (
      <View style={styles.fileEvidence}>
        <Ionicons name="document" size={24} color="#9370DB" />
        <Text style={styles.fileText}>
          {item.name || `File ${index + 1}`}
        </Text>
      </View>
    );
  };
  
  if (loading && !detailedComplaint) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9370DB" />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#f56c6c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{detailedComplaint?.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(detailedComplaint?.status) }
              ]}
            >
              <Text style={styles.statusText}>{detailedComplaint?.status}</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text style={styles.sectionTitle}>Submitted on</Text>
            </View>
            <Text style={styles.sectionContent}>
              {getFormattedDate(detailedComplaint?.createdAt)}
            </Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="white" />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>
            <Text style={styles.sectionContent}>{detailedComplaint?.address}</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color="white" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.sectionContent}>
              {detailedComplaint?.description || 'No description provided'}
            </Text>
          </View>
          
          {/* Handle both new mediaURL/mediaType format and legacy evidence array */}
          {((detailedComplaint?.mediaURL) || 
            (detailedComplaint?.evidence && detailedComplaint?.evidence.length > 0)) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="images-outline" size={20} color="white" />
                <Text style={styles.sectionTitle}>Evidence</Text>
              </View>
              <View style={styles.evidenceContainer}>
                {detailedComplaint.evidence && detailedComplaint.evidence.length > 0 ? (
                  // Handle evidence array
                  detailedComplaint.evidence.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.evidenceItem}
                      onPress={() => {
                        // Handle evidence item press (e.g., view image fullscreen)
                      }}
                    >
                      {renderMediaItem(item, index)}
                    </TouchableOpacity>
                  ))
                ) : detailedComplaint.mediaURL ? (
                  // Handle single mediaURL with mediaType
                  <TouchableOpacity
                    style={styles.evidenceItem}
                    onPress={() => {
                      // Handle media press
                    }}
                  >
                    {renderMediaItem(detailedComplaint.mediaURL)}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
          
          {detailedComplaint?.comments && detailedComplaint?.comments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbubbles-outline" size={20} color="white" />
                <Text style={styles.sectionTitle}>Comments</Text>
              </View>
              <View style={styles.commentsContainer}>
                {detailedComplaint.comments.map((comment, index) => (
                  <View key={index} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentDate}>
                        {getFormattedDate(comment.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f56c6c',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(147, 112, 219, 0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#131419',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
  },
  evidenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  evidenceItem: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  fileEvidence: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fileText: {
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  commentsContainer: {
    marginTop: 8,
  },
  commentItem: {
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  commentText: {
    fontSize: 14,
    color: '#ddd',
  },
});

export default ComplaintDetail;