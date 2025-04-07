import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,  
  RefreshControl,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';

const { width } = Dimensions.get('window');

const Community = () => {
  // Animated values
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activePost, setActivePost] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('forYou');
  const navigation = useNavigation();
  
  const auth = getAuth();
  const database = getDatabase();
  
  // Load posts from Firebase
  const loadPosts = (filterType = 'forYou') => {
    setRefreshing(true);
    
    try {
      // Get reference to posts in Firebase
      const postsRef = ref(database, 'posts');
      
      // Create query based on filter
      let postsQuery;
      if (filterType === 'trending') {
        // Order by likes for trending
        postsQuery = query(postsRef, orderByChild('likes'), limitToLast(10));
      } else {
        // For "For You" we'll just get the most recent posts
        postsQuery = query(postsRef, orderByChild('timestamp'), limitToLast(20));
      }
      
      // Listen for data
      onValue(postsQuery, (snapshot) => {
        const postsData = [];
        snapshot.forEach((childSnapshot) => {
          const post = childSnapshot.val();
          postsData.push({
            id: childSnapshot.key,
            name: post.userName || 'Anonymous',
            avatar: post.userProfilePic || require('../assets/reg1.jpg'), // Fallback to default
            timeAgo: getTimeAgo(post.timestamp),
            content: post.text,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            image: post.imageUrl ? { uri: post.imageUrl } : null,
            gradient: getRandomGradient()
          });
        });
        
        // Sort data by timestamp (newest first)
        postsData.sort((a, b) => b.timestamp - a.timestamp);
        
        setPosts(postsData);
        setRefreshing(false);
      }, (error) => {
        console.error("Error loading posts:", error);
        Alert.alert("Error", "Could not load posts. Please try again later.");
        setRefreshing(false);
      });
    } catch (error) {
      console.error("Error setting up posts listener:", error);
      setRefreshing(false);
    }
  };
  
  // Helper function to get random gradient for posts
  const getRandomGradient = () => {
    const gradients = [
      ['#FF416C', '#FF4B2B'],
      ['#4568DC', '#B06AB3'],
      ['#134E5E', '#71B280'],
      ['#0F2027', '#203A43'],
      ['#11998e', '#38ef7d']
    ];
    
    return gradients[Math.floor(Math.random() * gradients.length)];
  };
  
  // Helper function to calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };
  
  // Load initial posts
  useEffect(() => {
    loadPosts();
    
    // Cleanup function
    return () => {
      // Firebase listeners are automatically detached when the component unmounts
    };
  }, []);
  
  // Handle refresh
  const onRefresh = () => {
    loadPosts(activeFilter);
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    loadPosts(filter);
  };

  // Handle like press with animation
  const handleLikePress = (postId) => {
    setActivePost(postId);
    
    // Update likes count locally for immediate feedback
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {...post, likes: post.likes + 1}
          : post
      )
    );
    
    // Update likes in Firebase (would need to implement)
    // updatePostLikes(postId);
    
    // Reset active post after animation
    setTimeout(() => setActivePost(null), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: scrollY.interpolate({
            inputRange: [0, 50, 100],
            outputRange: [1, 0.9, 1],
            extrapolate: 'clamp'
          }),
          transform: [
            { 
              translateY: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, -5],
                extrapolate: 'clamp'
              })
            }
          ]
        }
      ]}>
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>Community</Text>
        
        </LinearGradient>
      </Animated.View>
      
      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'forYou' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('forYou')}
        >
          <Text style={activeFilter === 'forYou' ? styles.activeFilterText : styles.filterText}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'trending' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('trending')}
        >
          <Text style={activeFilter === 'trending' ? styles.activeFilterText : styles.filterText}>
            Trending
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Timeline Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#8a2be2"
            colors={['#8a2be2', '#9370db']}
          />
        }
      >
        {refreshing && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={50} color="#555" />
            <Text style={styles.emptyText}>No posts to display</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post, index) => (
            <View 
              key={post.id} 
              style={[
                styles.postContainer,
                {
                  transform: [
                    { 
                      scale: activePost === post.id ? 1.01 : 1
                    }
                  ],
                  shadowOpacity: activePost === post.id ? 0.3 : 0,
                }
              ]}
            >
              {/* User info */}
              <View style={styles.userInfoContainer}>
                <View style={styles.userInfo}>
                  {typeof post.avatar === 'string' ? (
                    <Image source={{ uri: post.avatar }} style={styles.avatar} />
                  ) : (
                    <Image source={post.avatar} style={styles.avatar} />
                  )}
                  <View>
                    <Text style={styles.userName}>{post.name}</Text>
                    <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Feather name="more-horizontal" size={20} color="#888" />
                </TouchableOpacity>
              </View>
              
              {/* Post content */}
              <Text style={styles.postContent}>{post.content}</Text>
              
              {/* Post image if available */}
              {post.image && (
                <View style={styles.imageContainer}>
                  {typeof post.image === 'string' ? (
                    <Image source={{ uri: post.image }} style={styles.postImage} />
                  ) : (
                    <Image source={post.image} style={styles.postImage} />
                  )}
                </View>
              )}
              
              {/* Interaction buttons */}
              <View style={styles.interactionContainer}>

                
                <View style={styles.interactionItem}>
                  <TouchableOpacity 
                    style={styles.interactionButton}
                    onPress={() => handleLikePress(post.id)}
                  >
                    <LinearGradient
                      colors={activePost === post.id ? ['#f43b47', '#453a94'] : ['#333', '#222']}
                      style={styles.interactionBackground}
                    >
                      <Feather name="heart" size={18} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.interactionCount}>{post.likes}</Text>
                </View>
                
              
              </View>
              
              <View style={styles.divider} />
            </View>
          ))
        )}
        
        <View style={{ height: 80 }} />
      </Animated.ScrollView>
      
      {/* Floating Action Button for creating a post */}
      <TouchableOpacity 
        style={styles.fabContainer}
        onPress={() => navigation.navigate('Addpost')}
      >
        <LinearGradient
          colors={['white', 'white']}
          style={styles.fab}
        >
          <Feather name="edit" size={24} color="" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    zIndex: 10,
    position: 'relative',
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'System',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    backgroundColor: '#0A0A0A',
  },
  filterTab: {
    marginRight: 20,
    paddingVertical: 8,
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'white',
  },
  filterText: {
    color: '#888',
    fontSize: 15,
    fontFamily: 'System',
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  loadingText: {
    color: '#888',
    fontSize: 17,
    fontFamily: 'System',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    color: '#888',
    fontSize: 17,
    marginTop: 10,
    fontFamily: 'System',
  },
  refreshButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#222',
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontFamily: 'System',
  },
  postContainer: {
    padding: 16,
    backgroundColor: '#0A0A0A',
    marginBottom: 8,
    borderRadius: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    fontFamily: 'System',
  },
  timeAgo: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'System',
  },
  moreButton: {
    padding: 5,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    color: '#fff',
    fontFamily: 'System',
  },
  imageContainer: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  interactionButton: {
    marginRight: 4,
  },
  interactionBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interactionCount: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginTop: 10,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Community;