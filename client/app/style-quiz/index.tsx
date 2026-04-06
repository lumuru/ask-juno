import { View, Text, StyleSheet } from "react-native";

export default function StyleQuizScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Style Quiz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#E8E6E1", fontSize: 16 },
});
