// Write a code that will create colorful circle when left mouse button is clicked. After mouse button is released, the circle should be removed. Colorful circle center must be the mouse position.
import { View, Animated, StatusBar, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Stack } from "expo-router";

const PREDEFINED_COLORS = [
  '#FF3B30', // Red
  '#007AFF', // Blue
  '#4CD964', // Green
  '#FF9500', // Orange
  '#5856D6', // Purple
  '#FFD60A', // Yellow
  '#00C7BE', // Teal
  '#FF2D55', // Pink
  '#8E8E93', // Gray
  '#34C759', // Lime
];

// Add new GROUP_COLORS constant
const GROUP_COLORS = {
  1: '#FF0000', // Red
  2: '#00FF00', // Green
  3: '#0000FF', // Blue
  4: '#FFFF00', // Yellow
};

const CIRCLE_EXPAND_SIZE = Math.max(
  Dimensions.get('window').width,
  Dimensions.get('window').height
) * 2;

const TITLE_COLORS = [
  '#FF3B30', // Red - S
  '#007AFF', // Blue - P
  '#4CD964', // Green - L
  '#FF9500', // Orange - I
  '#5856D6', // Purple - T
  '#FFD60A', // Yellow - I
  '#FF2D55', // Pink - O
];

export default function App() {
  const [circles, setCircles] = useState<Map<number, {
    x: number,
    y: number,
    color: string,
    scaleAnim: Animated.Value,
    positionX: Animated.Value,
    positionY: Animated.Value,
  }>>(new Map());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'groupChecker' | 'groupSplitter' | 'pickOne'>('groupSplitter');
  const [groupCount, setGroupCount] = useState(2);
  const [lastTouchTime, setLastTouchTime] = useState(Date.now());
  const [isGrouping, setIsGrouping] = useState(false);
  const menuAnimation = useRef(new Animated.Value(-300)).current;
  const blinkAnimation = useRef(new Animated.Value(1)).current;
  const groupingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [shouldRemoveCircles, setShouldRemoveCircles] = useState(false);
  const removeTimeout = useRef<NodeJS.Timeout | null>(null);
  const blinkAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [pickedCircleId, setPickedCircleId] = useState<number | null>(null);
  const [expandingColor, setExpandingColor] = useState<string | null>(null);
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const [isGroupSplitterOpen, setIsGroupSplitterOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  const generateRandomColor = (existingColors: string[]) => {
    // Filter out colors that are already in use
    const availableColors = PREDEFINED_COLORS.filter(
      color => !existingColors.includes(color)
    );
    
    // If all colors are used, return the first predefined color (shouldn't happen with 10 colors)
    if (availableColors.length === 0) {
      return PREDEFINED_COLORS[0];
    }
    
    // Return a random color from available colors
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Clear old circles if groupSplitter is active
    if (selectedOption === 'groupSplitter' && isGrouping) {
      stopGroupingAnimation();
      setCircles(new Map()); // Clear all circles
      return; // Exit early to prevent new circle creation
    }

    // Clear old circles and expanding color if present
    if (expandingColor || isGrouping) {
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
      }
      setExpandingColor(null);
      setCircles(new Map()); // Clear old circles
      stopGroupingAnimation(); // Stop any ongoing grouping animation
    }

    setLastTouchTime(Date.now());
    if (isGrouping) {
      stopGroupingAnimation();
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const newCircles = new Map(circles); // Keep existing circles by copying the map
    
    Array.from(e.touches).forEach(touch => {
      if (!newCircles.has(touch.identifier)) { // Only create new circle if it doesn't exist
        const newX = touch.clientX - rect.left;
        const newY = touch.clientY - rect.top;
        
        // Get existing colors
        const existingColors = Array.from(newCircles.values()).map(circle => circle.color);
        
        newCircles.set(touch.identifier, {
          x: newX,
          y: newY,
          color: generateRandomColor(existingColors),
          scaleAnim: new Animated.Value(0.75),
          positionX: new Animated.Value(newX),
          positionY: new Animated.Value(newY),
        });

        // Start animation for new circle
        Animated.loop(
          Animated.sequence([
            Animated.timing(newCircles.get(touch.identifier)!.scaleAnim, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(newCircles.get(touch.identifier)!.scaleAnim, {
              toValue: 0.75,
              duration: 200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });

    setCircles(newCircles);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (selectedOption === 'groupSplitter' && isGrouping) {
      // Stop animations and make circles opaque
      const newCircles = new Map(circles);
      Array.from(newCircles.values()).forEach(circle => {
        circle.scaleAnim.stopAnimation();
        circle.scaleAnim.setValue(1);
      });
      
      // Don't set a timeout - let handleTouchStart handle the cleanup
      setCircles(newCircles);
      return;
    }

    // Original touch end logic for other cases
    const newCircles = new Map(circles);
    Array.from(e.changedTouches).forEach(touch => {
      newCircles.delete(touch.identifier);
    });
    setCircles(newCircles);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    Array.from(e.touches).forEach(touch => {
      const circle = circles.get(touch.identifier);
      if (circle) {
        const newX = touch.clientX - rect.left;
        const newY = touch.clientY - rect.top;
        
        Animated.spring(circle.positionX, {
          toValue: newX,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }).start();
        
        Animated.spring(circle.positionY, {
          toValue: newY,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }).start();
      }
    });
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -300 : 0;
    Animated.spring(menuAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 10
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };
  const startGroupingAnimation = () => {
    setIsGrouping(true);
    
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
    }

    blinkAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnimation, {
          toValue: 0.4,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    blinkAnimationRef.current.start();

    // Shuffle the circles randomly
    const circleIds = Array.from(circles.keys());
    for (let i = circleIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [circleIds[i], circleIds[j]] = [circleIds[j], circleIds[i]];
    }

    const newCircles = new Map(circles);
    
    // Assign circles to groups using GROUP_COLORS
    circleIds.forEach((id, index) => {
      const groupIndex = (index % groupCount) + 1;
      const circle = newCircles.get(id);
      if (circle) {
        circle.color = GROUP_COLORS[groupIndex as keyof typeof GROUP_COLORS];
      }
    });

    setCircles(newCircles);
  };

  // Stop animation helper
  const stopGroupingAnimation = () => {
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
      blinkAnimationRef.current = null;
    }
    blinkAnimation.setValue(1);
    setIsGrouping(false);
  };

  useEffect(() => {
    if (selectedOption === 'groupSplitter' && circles.size > 0) {
      if (groupingTimeout.current) {
        clearTimeout(groupingTimeout.current);
      }
      
      groupingTimeout.current = setTimeout(() => {
        if (Date.now() - lastTouchTime >= 2000) {
          console.log('Starting grouping animation');
          startGroupingAnimation();
          
          // Clear screen after 5 seconds
          setTimeout(() => {
            setCircles(new Map());
            setIsGrouping(false);
          }, 5000);
        }
      }, 2000);
    } else if (selectedOption === 'pickOne' && circles.size > 0) {
      if (groupingTimeout.current) {
        clearTimeout(groupingTimeout.current);
      }
      
      groupingTimeout.current = setTimeout(() => {
        if (Date.now() - lastTouchTime >= 2000) {
          const circleIds = Array.from(circles.keys());
          const randomId = circleIds[Math.floor(Math.random() * circleIds.length)];
          const selectedCircle = circles.get(randomId)!;
          setPickedCircleId(randomId);
          setExpandingColor(selectedCircle.color);
          
          // Keep only the picked circle
          const newCircles = new Map();
          newCircles.set(randomId, selectedCircle);
          setCircles(newCircles);

          // Start expansion animation
          expandAnimation.setValue(0);
          Animated.sequence([
            Animated.timing(selectedCircle.scaleAnim, {
              toValue: 0.9,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(expandAnimation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            })
          ]).start();

          // Clear screen after 5 seconds
          setTimeout(() => {
            setCircles(new Map());
            setExpandingColor(null);
          }, 5000);
        }
      }, 2000);
    }

    return () => {
      if (groupingTimeout.current) {
        clearTimeout(groupingTimeout.current);
      }
    };
  }, [lastTouchTime, selectedOption, circles.size]);

  // Stop animations when changing options
  useEffect(() => {
    if (selectedOption !== 'groupSplitter') {
      stopGroupingAnimation();
    }
  }, [selectedOption]);

  // Clean up circles after delay
  useEffect(() => {
    if (shouldRemoveCircles) {
      setCircles(new Map());
      setShouldRemoveCircles(false);
      stopGroupingAnimation();
    }
  }, [shouldRemoveCircles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
      }
      stopGroupingAnimation();
    };
  }, []);

  const menuOptions = [
    { 
      id: 'groupSplitter',
      title: 'Group Splitter',
      subMenu: (
        <View style={{ marginTop: 10, marginLeft: 20 }}>
          {[2, 3, 4].map((num) => (
            <TouchableOpacity
              key={num}
              style={{
                padding: 10,
                backgroundColor: groupCount === num ? '#e0e0e0' : 'transparent',
                borderRadius: 5,
                marginBottom: 5,
              }}
              onPress={() => setGroupCount(num)}
            >
              <Text style={{ color: '#333' }}>{num} Groups</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    { 
      id: 'pickOne', 
      title: 'Pick One',
    }
  ];

  const handleAboutPress = () => {
    window.open('https://github.com/byesilbag', '_blank');
  };

  const handleBuyMeACoffee = () => {
    window.open('https://www.buymeacoffee.com/bartuyesilbag', '_blank');
  };

  const WelcomePopup = () => (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <View style={{
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        maxWidth: 400,
        width: '90%',
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 15,
          color: '#007AFF',
        }}>
          Welcome to Splittio!
        </Text>
        <Text style={{
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 15,
          color: '#333',
        }}>
          Splittio is an interactive tool for group organization and random selection.{'\n\n'}
          🎯 Group Splitter: Touch and hold multiple points to create circles, then watch as they automatically split into color-coded groups.{'\n\n'}
          🎲 Pick One: Place multiple circles and let the app randomly select one for you!{'\n\n'}
          Perfect for team division, decision making, or just having fun!
        </Text>
        <TouchableOpacity
          onPress={() => setShowWelcomePopup(false)}
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          viewport: {
            maximumScale: 1,
            minimumScale: 1,
            userScalable: false,
          }
        }} 
      />
      <StatusBar hidden={true} />
      <View style={{ 
        flex: 1, 
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        touchAction: 'none', // Prevent zoom gestures
      }}>
        {/* Add Welcome Popup */}
        {showWelcomePopup && <WelcomePopup />}

        {/* Add Title */}
        <View style={{
          position: 'absolute',
          top: 20,
          left: 0,
          right: 0,
          zIndex: 98,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {'SPLITTIO'.split('').map((letter, index) => (
            <Text
              key={index}
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: TITLE_COLORS[index],
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {letter}
            </Text>
          ))}
        </View>

        {expandingColor && (
          <Animated.View
            style={{
              position: 'absolute',
              width: CIRCLE_EXPAND_SIZE,
              height: CIRCLE_EXPAND_SIZE,
              backgroundColor: expandingColor,
              borderRadius: CIRCLE_EXPAND_SIZE / 2,
              transform: [
                { 
                  translateX: Animated.add(
                    circles.get(pickedCircleId!)?.x || 0,
                    -CIRCLE_EXPAND_SIZE / 2
                  )
                },
                { 
                  translateY: Animated.add(
                    circles.get(pickedCircleId!)?.y || 0,
                    -CIRCLE_EXPAND_SIZE / 2
                  )
                },
                {
                  scale: expandAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2.5], // Increased scale for full coverage
                  }),
                },
              ],
              opacity: 1,
            }}
          />
        )}

        {/* Menu Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 100,
            padding: 10,
          }}
          onPress={toggleMenu}
        >
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>

        {/* Updated Sidebar Menu */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 300,
            backgroundColor: 'rgba(255,255,255,0.95)',
            zIndex: 99,
            transform: [{ translateX: menuAnimation }],
          }}
        >
          <ScrollView
            style={{
              flex: 1,
              paddingHorizontal: 20,
              paddingTop: 70,
            }}
            showsVerticalScrollIndicator={true}
          >
            {menuOptions.map((option) => (
              <View key={option.id}>
                <TouchableOpacity
                  style={{
                    padding: 15,
                    marginBottom: option.subMenu ? 0 : 10,
                    backgroundColor: selectedOption === option.id ? '#007AFF' : 'transparent',
                    borderRadius: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (option.id === 'groupSplitter') {
                      setIsGroupSplitterOpen(!isGroupSplitterOpen);
                      // Also set the selected option
                      if (selectedOption !== option.id) {
                        setSelectedOption(option.id);
                        setCircles(new Map());
                        setExpandingColor(null);
                        stopGroupingAnimation();
                      }
                    } else {
                      if (selectedOption !== option.id) {
                        setSelectedOption(option.id);
                        setCircles(new Map());
                        setExpandingColor(null);
                        stopGroupingAnimation();
                      }
                      toggleMenu();
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: selectedOption === option.id ? 'white' : '#333',
                    }}
                  >
                    {option.title}
                  </Text>
                  {option.id === 'groupSplitter' && (
                    <Text style={{ 
                      fontSize: 16,
                      color: selectedOption === option.id ? 'white' : '#333',
                    }}>
                      {isGroupSplitterOpen ? '▼' : '▶'}
                    </Text>
                  )}
                </TouchableOpacity>
                {option.id === 'groupSplitter' && isGroupSplitterOpen && option.subMenu}
              </View>
            ))}
            
            {/* Add explanation section */}
            <View style={{ 
              marginTop: 20,
              backgroundColor: '#f8f9fa',
              padding: 15,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#e9ecef',
            }}>
              <Text style={{ fontSize: 14, lineHeight: 20, color: '#333' }}>
                Splittio is an interactive tool for group organization and random selection.{'\n\n'}
                🎯 Group Splitter: Touch and hold multiple points to create circles, then watch as they automatically split into color-coded groups.{'\n\n'}
                🎲 Pick One: Place multiple circles and let the app randomly select one for you!{'\n\n'}
                Perfect for team division, decision making, or just having fun!
              </Text>
            </View>

            {/* Add About section */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                marginBottom: 20,
                padding: 15,
                backgroundColor: '#007AFF',
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleAboutPress}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: '500' 
              }}>
                About
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginBottom: 20,
                alignItems: 'center',
              }}
              onPress={handleBuyMeACoffee}
            >
              <img 
                src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                alt="Buy Me A Coffee" 
                style={{ 
                  height: '60px',
                  width: '217px'
                }} 
              />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Main Touch Area with opacity animation */}
        <View 
          style={{ flex: 1 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {Array.from(circles.entries()).map(([id, circle]) => (
            <Animated.View
              key={id}
              style={{
                position: 'absolute',
                transform: [
                  { translateX: Animated.subtract(circle.positionX, 50) },
                  { translateY: Animated.subtract(circle.positionY, 50) },
                  { scale: circle.scaleAnim }
                ],
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: circle.color,
                opacity: isGrouping ? blinkAnimation : (selectedOption === 'groupSplitter' ? 1 : 0.6),
              }}
            >
              {/* Add border circle */}
              <View
                style={{
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 2,
                  borderColor: circle.color,
                }}
              />
            </Animated.View>
          ))}
        </View>

        {/* Overlay to close menu when clicking outside */}
        {isMenuOpen && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 98,
            }}
            onPress={toggleMenu}
          />
        )}
      </View>
    </>
  );
}
