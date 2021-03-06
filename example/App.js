import Expo from 'expo';
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { ActionSheetProvider, connectActionSheet } from '@expo/react-native-action-sheet';
import ShowActionSheetButton from './ShowActionSheetButton';

export default class AppContainer extends React.Component {
  render() {
    return (
      <ActionSheetProvider>
        <App />
      </ActionSheetProvider>
    );
  }
}

@connectActionSheet
class App extends React.Component {
  state = {
    selectedIndex: null,
  };

  _updateSelectionText = (selectedIndex) => {
    this.setState({ selectedIndex });
  };

  _renderSelectionText() {
    const { selectedIndex } = this.state;
    const text = selectedIndex === null
      ? 'No Option Selected'
      : `Option #${selectedIndex + 1} Selected`;

    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ textAlign: 'center', color: 'blue', fontSize: 16 }}>
          {text}
        </Text>
      </View>
    )
  }

  _renderButtons() {
    const { showActionSheetWithOptions } = this.props;
    return (
      <View style={{ alignItems: 'center' }}>
        <ShowActionSheetButton
          title="Options Only"
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Title"
          withTitle
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Title & Message"
          withTitle
          withMessage
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Icons"
          withIcons
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Title, Message, & Icons"
          withTitle
          withMessage
          withIcons
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Use Separators"
          withTitle
          withIcons
          withSeparators
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
        <ShowActionSheetButton
          title="Custom Styles"
          withTitle
          withMessage
          withIcons
          withCustomStyles
          onSelection={this._updateSelectionText}
          showActionSheetWithOptions={showActionSheetWithOptions} />
      </View>
    )
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={{ marginBottom: 30 }}>
            <Text style={{ textAlign: 'center', fontSize: 16 }}>
              {"Hello!\n\nThis is a simple example app to demonstrate @expo/react-native-action-sheet."}
            </Text>
          </View>
          {this._renderButtons()}
          {this._renderSelectionText()}
          <Text style={{ marginTop: 32 }}>
            Note: Icons and custom text styles are only available on Android. Separators can only be toggled on Android; they always show on iOS.
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  contentContainer: {
    alignItems: 'center',
  },
});
