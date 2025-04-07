import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase';

const HomeScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // Create animation values for list items
  const [itemAnimations] = useState(() => {
    return Array(20).fill(0).map(() => new Animated.Value(0));
  });
  
  // Firebase instances
  const auth = getAuth(app);
  const database = getDatabase(app);
  
  useEffect(() => {
    // Start loading animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start continuous floating animation for FAB
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    loadComplaints();
  }, []);
  
  // Start animations for list items when complaints are loaded
  useEffect(() => {
    if (!loading && complaints.length > 0) {
      complaints.forEach((_, index) => {
        if (index < itemAnimations.length) {
          Animated.timing(itemAnimations[index], {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        }
      });
    }
  }, [loading, complaints]);
  
  const loadComplaints = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Please log in to view complaints');
        setLoading(false);
        return;
      }
      
      // Reference to get user-specific complaints
      const complaintsRef = ref(database, `users/${currentUser.uid}/complaints`);
      
      // Listen for changes to get user complaints
      onValue(complaintsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const count = Object.keys(data).length;
          setTotalComplaints(count);
          
          const complaintsArray = Object.keys(data).map(key => ({
            id: key,
            userId: currentUser.uid, // Adding userId to each complaint for reference
            ...data[key]
          }));
          
          // Sort by createdAt timestamp (newest first)
          complaintsArray.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setComplaints(complaintsArray);
        } else {
          setComplaints([]);
          setTotalComplaints(0);
        }
        setLoading(false);
      });
      
    } catch (error) {
      console.error("Error loading complaints:", error);
      setError('Failed to load complaints');
      setLoading(false);
    }
  };
  
  const handleComplaintPress = (complaint) => {
    // Navigate to complaint detail screen with the complaint data
    navigation.navigate('Complaindetails', { complaint });
  };
  
  const handleAddComplaint = () => {
    navigation.navigate('AddComplaint');
  };
  
  // Helper function to get status color
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
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Render each complaint item with animation
  const renderComplaintItem = ({ item, index }) => {
    // Use pre-initialized animation value from array
    const itemAnimation = index < itemAnimations.length ? itemAnimations[index] : new Animated.Value(1);
    
    return (
      <Animated.View
        style={{
          opacity: itemAnimation,
          transform: [
            {
              translateY: itemAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={styles.complaintItem}
          onPress={() => handleComplaintPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.complaintHeader}>
            <Text style={styles.complaintTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.dateText}>
              {getFormattedDate(item.createdAt)}
            </Text>
          </View>
          
          <View style={styles.complaintContent}>
            <Text style={styles.complaintDescription} numberOfLines={2}>
              {item.description || 'No description provided'}
            </Text>
          </View>
          
          <View style={styles.complaintFooter}>
            <View style={styles.addressBadge}>  
              <Ionicons 
                name="location-outline" 
                size={14} 
                color="#fff" 
              />
              <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) }
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Complaints</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadComplaints()}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsCard}>
          <View style={styles.statsContent}>
            <Text style={styles.statsNumber}>{totalComplaints}</Text>
            <Text style={styles.statsLabel}>Total Reports</Text>
          </View>
        </View>
      </Animated.View>
      
      {complaints.length > 0 ? (
        <FlatList
          data={complaints}
          renderItem={renderComplaintItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View 
          style={[
            styles.emptyContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }]
            }
          ]}
        >
          <Ionicons name="document-text-outline" size={70} color="#9370DB" />
          <Text style={styles.emptyText}>No complaints yet</Text>
          <Text style={styles.emptySubText}>Create your first complaint</Text>
          
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddComplaint}
          >
            <Text style={styles.emptyButtonText}>Add Complaint</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <Animated.View
        style={[
          styles.addButton,
          {
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
       
      </Animated.View>
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
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 112, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#131419',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: 'white',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
  },
  statsLabel: {
    fontSize: 16,
    color: '#aaa',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  complaintItem: {
    backgroundColor: '#131419',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  complaintContent: {
    marginBottom: 12,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 227, 240, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    maxWidth: '70%',
  },
  addressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#9370DB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  addButtonTouchable: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9370DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9370DB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#A080E0',
  },
});

export default HomeScreen;