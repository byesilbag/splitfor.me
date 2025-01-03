// Write a code that will create colorful circle when left mouse button is clicked. After mouse button is released, the circle should be removed. Colorful circle center must be the mouse position.
import { View, Animated, StatusBar, Text, TouchableOpacity, Dimensions } from "react-native";
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

const CIRCLE_EXPAND_SIZE = Math.min(window.innerWidth, window.innerHeight) * 0.8; // Increased from previous value

// Alternative if you want it even bigger:
// const CIRCLE_EXPAND_SIZE = Math.max(window.innerWidth, window.innerHeight);

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
    
    // Stop any existing animation
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
    }

    // Create and store the animation reference
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

    // Start the animation
    blinkAnimationRef.current.start();

    // Assign groups
    const circleIds = Array.from(circles.keys());
    const newCircles = new Map(circles);
    
    // Generate different colors for each group
    const groupColors = Array.from({ length: groupCount }, (_, i) => 
      `hsl(${(360 / groupCount) * i}, 70%, 50%)`
    );

    // Assign colors to circles based on groups
    circleIds.forEach((id, index) => {
      const groupIndex = index % groupCount;
      const circle = newCircles.get(id);
      if (circle) {
        circle.color = groupColors[groupIndex];
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
          newCircles.set(randomId, {
            ...selectedCircle,
            scaleAnim: new Animated.Value(0.75) // Ensure picked circle is also at 75%
          });
          setCircles(newCircles);

          // Start expansion animation from the circle's position
          expandAnimation.setValue(0);
          Animated.timing(expandAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }).start(() => {
            setExpandingColor(selectedCircle.color);
          });
        }
      }, 2000);
    }

    return () => {
      if (groupingTimeout.current) {
        clearTimeout(groupingTimeout.current);
      }
    };
  }, [lastTouchTime, selectedOption, circles.size, groupCount]);

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
    { id: 'pickOne', title: 'Pick One' }
  ];

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
      <View style={{ flex: 1 }}>
        {expandingColor && (
          <Animated.View
            style={{
              position: 'absolute',
              width: Dimensions.get('window').width * 3,
              height: Dimensions.get('window').width * 3,
              backgroundColor: expandingColor,
              borderRadius: Dimensions.get('window').width * 1.5,
              transform: [
                { 
                  translateX: Animated.subtract(
                    circles.get(pickedCircleId!)?.positionX || 0,
                    Animated.multiply(expandAnimation, Dimensions.get('window').width * 1.5)
                  )
                },
                { 
                  translateY: Animated.subtract(
                    circles.get(pickedCircleId!)?.positionY || 0,
                    Animated.multiply(expandAnimation, Dimensions.get('window').width * 1.5)
                  )
                },
                {
                  scale: expandAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 1],
                  }),
                },
              ],
              opacity: selectedOption === 'groupSplitter' ? 1 : 0.6,
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
            padding: 20,
            paddingTop: 70,
            shadowColor: "#000",
            shadowOffset: {
              width: 2,
              height: 0
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {menuOptions.map((option) => (
            <View key={option.id}>
              <TouchableOpacity
                style={{
                  padding: 15,
                  marginBottom: option.subMenu ? 0 : 10,
                  backgroundColor: selectedOption === option.id ? '#007AFF' : 'transparent',
                  borderRadius: 8,
                }}
                onPress={() => {
                  setSelectedOption(option.id);
                  if (!option.subMenu) {
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
              </TouchableOpacity>
              {selectedOption === option.id && option.subMenu}
            </View>
          ))}
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
