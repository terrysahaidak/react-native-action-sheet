// @flow

import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  StyleSheet,
  Text,
  Image,
  NativeModules,
  TouchableOpacity,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from 'react-native';

type ActionSheetOptions = {
  options: Array<string>,
  icons?: ?Array<number | React.Node>,
  tintIcons?: ?boolean,
  destructiveButtonIndex?: ?number,
  cancelButtonIndex?: ?number,
  textStyle?: ?any,
  tintColor?: ?string,
  title?: ?string,
  titleTextStyle?: ?any,
  message?: ?string,
  messageTextStyle?: ?any,
  showSeparators?: ?boolean,
  groupContainerStyle: ?any,
};

type ActionGroupProps = {
  options: Array<string>,
  icons: ?Array<number | React.Node>,
  tintIcons: ?boolean,
  destructiveButtonIndex: ?number,
  onSelect: (i: number) => boolean,
  startIndex: number,
  length: number,
  textStyle: ?any,
  tintColor: ?string,
  title: ?string,
  titleTextStyle: ?any,
  message: ?string,
  messageTextStyle: ?any,
  showSeparators: ?boolean,
  groupContainerStyle: ?any,
};

type ActionSheetState = {
  isVisible: boolean,
  isAnimating: boolean,
  options: ?ActionSheetOptions,
  onSelect: ?(i: number) => void,
  overlayOpacity: any,
  sheetOpacity: any,
};

type ActionSheetProps = {
  children: ?any,
  useNativeDriver: ?boolean,
};

const OPACITY_ANIMATION_IN_TIME = 225;
const OPACITY_ANIMATION_OUT_TIME = 195;
const EASING_OUT = Easing.bezier(0.25, 0.46, 0.45, 0.94);
const EASING_IN = Easing.out(EASING_OUT);
const BLACK_54PC_TRANSPARENT = '#0000008a';
const BLACK_87PC_TRANSPARENT = '#000000de';

class ActionGroup extends React.Component {
  props: ActionGroupProps;

  render() {
    let {
      options,
      icons,
      tintIcons,
      destructiveButtonIndex,
      onSelect,
      startIndex,
      length,
      textStyle,
      tintColor,
      showSeparators,
      groupContainerStyle,
    } = this.props;

    let optionViews = [];

    let nativeFeedbackBackground = TouchableNativeFeedbackSafe.Ripple(
      'rgba(180, 180, 180, 1)',
      false
    );

    for (let i = startIndex; i < startIndex + length; i++) {
      const defaultColor = tintColor
        ? tintColor
        : (textStyle || {}).color || BLACK_87PC_TRANSPARENT;
      const color = i === destructiveButtonIndex ? '#d32f2f' : defaultColor;
      const iconSource = icons != null && icons[i];
      let iconElement = undefined;

      if (iconSource) {
        if (typeof iconSource === 'number') {
          const iconStyle = [styles.icon, { tintColor: tintIcons ? color : null }];
          iconElement = <Image
            fadeDuration={0}
            source={iconSource}
            resizeMode="contain"
            style={iconStyle}/>;
        } else {
          iconElement = <View style={styles.icon}>{iconSource}</View>;
        }
      }

      optionViews.push(
        <TouchableNativeFeedbackSafe
          key={i}
          pressInDelay={0}
          background={nativeFeedbackBackground}
          onPress={() => onSelect(i)}
          style={styles.button}>
          {iconElement}
          <Text style={[styles.text, textStyle, { color }]}>{options[i]}</Text>
        </TouchableNativeFeedbackSafe>
      );

      if (showSeparators && i < startIndex + length - 1) {
        optionViews.push(this._renderRowSeparator(i));
      }
    }

    return (
      <View style={[styles.groupContainer, groupContainerStyle]}>
        {this._renderTitleContent()}
        <ScrollView>{optionViews}</ScrollView>
      </View>
    );
  }

  _renderRowSeparator(key) {
    return <View key={key ? `separator-${key}` : null} style={styles.rowSeparator} />;
  }

  _renderTitleContent()  {
    const { title, titleTextStyle, message, messageTextStyle, showSeparators } = this.props;

    if (!title && !message) {
      return null;
    }

    return (
      <View>
        <View style={[styles.titleContainer, { paddingBottom: showSeparators ? 24 : 16 }]}>
          {title ? <Text style={[styles.title, titleTextStyle]}>{title}</Text> : null}
          {message ? <Text style={[styles.message, messageTextStyle]}>{message}</Text> : null}
        </View>
        {showSeparators ? this._renderRowSeparator('title') : null}
      </View>
    )
  }
}

ActionGroup.propTypes = {
  options: PropTypes.array.isRequired,
  icons: PropTypes.array,
  tintIcons: PropTypes.bool,
  destructiveButtonIndex: PropTypes.number,
  onSelect: PropTypes.func.isRequired,
  startIndex: PropTypes.number.isRequired,
  length: PropTypes.number.isRequired,
  textStyle: Text.propTypes.style,
  tintColor: PropTypes.string,
  title: PropTypes.string,
  titleTextStyle: Text.propTypes.style,
  message: PropTypes.string,
  messageTextStyle: Text.propTypes.style,
  showSeparators: PropTypes.bool,
};

ActionGroup.defaultProps = {
  title: null,
  message: null,
  showSeparators: false,
  tintIcons: true,
};

// Has same API as https://facebook.github.io/react-native/docs/actionsheetios.html
export default class ActionSheet extends React.Component {
  props: ActionSheetProps;

  _actionSheetHeight = 360;
  _animateOutCallback: ?() => void = null;

  state: ActionSheetState = {
    isVisible: false,
    isAnimating: false,
    options: null,
    onSelect: null,
    overlayOpacity: new Animated.Value(0),
    sheetOpacity: new Animated.Value(0),
  };

  _setActionSheetHeight = ({ nativeEvent }) =>
    this._actionSheetHeight = nativeEvent.layout.height;

  render() {
    const { isVisible, overlayOpacity } = this.state;
    const overlay = isVisible ? (
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      />
    ) : null;

    return (
      <View style={{ flex: 1 }}>
        {React.Children.only(this.props.children)}
        {overlay}
        {isVisible ? this._renderSheet() : null}
      </View>
    );
  }

  _renderSheet() {
    const { options } = this.state;

    if (!options) {
      return null;
    }

    return (
      <TouchableWithoutFeedback onPress={this._selectCancelButton}>
        <Animated.View
          needsOffscreenAlphaCompositing={this.state.isAnimating}
          style={[
            styles.sheetContainer,
            {
              opacity: this.state.sheetOpacity,
              transform: [
                {
                  translateY: this.state.sheetOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [this._actionSheetHeight, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.sheet} onLayout={this._setActionSheetHeight}>
            <ActionGroup
              options={options.options}
              icons={options.icons}
              groupContainerStyle={options.groupContainerStyle}
              tintIcons={options.tintIcons}
              destructiveButtonIndex={options.destructiveButtonIndex}
              onSelect={this._onSelect}
              startIndex={0}
              length={options.options.length}
              textStyle={options.textStyle}
              tintColor={options.tintColor}
              title={options.title}
              titleTextStyle={options.titleTextStyle}
              message={options.message}
              messageTextStyle={options.messageTextStyle}
              showSeparators={options.showSeparators}
            />
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }

  showActionSheetWithOptions(
    options: ActionSheetOptions,
    onSelect: (i: number) => void,
    onAnimateOut: () => void
  ) {
    const { isVisible, overlayOpacity, sheetOpacity } = this.state;

    if (isVisible) {
      return;
    }

    this.setState({
      options,
      onSelect,
      isVisible: true,
      isAnimating: true,
    });

    overlayOpacity.setValue(0);
    sheetOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.32,
        easing: EASING_OUT,
        duration: OPACITY_ANIMATION_IN_TIME,
        useNativeDriver: this.props.useNativeDriver,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        easing: EASING_OUT,
        duration: OPACITY_ANIMATION_IN_TIME,
        useNativeDriver: this.props.useNativeDriver,
      }),
    ]).start(result => {
      if (result.finished) {
        this.setState({
          isAnimating: false,
        });
      }
    });

    this._animateOutCallback = onAnimateOut;

    BackHandler.addEventListener(
      'actionSheetHardwareBackPress',
      this._selectCancelButton
    );
  }

  _selectCancelButton = () => {
    const { options } = this.state;
    if (!options) {
      return false;
    }

    if (typeof options.cancelButtonIndex === 'number') {
      return this._onSelect(options.cancelButtonIndex);
    } else {
      return this._animateOut();
    }
  };

  _onSelect = (index: number): boolean => {
    const { isAnimating, onSelect } = this.state;

    if (isAnimating) {
      return false;
    }

    onSelect && onSelect(index);
    return this._animateOut();
  };

  _animateOut = (): boolean => {
    const { isAnimating, overlayOpacity, sheetOpacity } = this.state;

    if (isAnimating) {
      return false;
    }

    BackHandler.removeEventListener(
      'actionSheetHardwareBackPress',
      this._selectCancelButton
    );

    this.setState({
      isAnimating: true,
    });

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        easing: EASING_IN,
        duration: OPACITY_ANIMATION_OUT_TIME,
        useNativeDriver: this.props.useNativeDriver,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        easing: EASING_IN,
        duration: OPACITY_ANIMATION_OUT_TIME,
        useNativeDriver: this.props.useNativeDriver,
      }),
    ]).start(result => {
      if (result.finished) {
        this.setState({
          isVisible: false,
          isAnimating: false,
        });
        if (typeof this._animateOutCallback === 'function') {
          this._animateOutCallback();
          this._animateOutCallback = null;
        }
      }
    });

    return true;
  };
}

ActionSheet.defaultProps = {
  useNativeDriver: true,
};

let TouchableComponent;

TouchableComponent = Platform.Version <= 20 ? TouchableOpacity : TouchableNativeFeedback;

if (TouchableComponent !== TouchableNativeFeedback) {
  TouchableComponent.SelectableBackground = () => ({});
  TouchableComponent.SelectableBackgroundBorderless = () => ({});
  TouchableComponent.Ripple = (color, borderless) => ({});
}

class TouchableNativeFeedbackSafe extends React.Component {
  static SelectableBackground = TouchableComponent.SelectableBackground;
  static SelectableBackgroundBorderless = TouchableComponent.SelectableBackgroundBorderless;
  static Ripple = TouchableComponent.Ripple;

  render() {
    if (TouchableComponent === TouchableNativeFeedback) {
      return (
        <TouchableComponent {...this.props} style={{}}>
          <View style={this.props.style}>{this.props.children}</View>
        </TouchableComponent>
      );
    } else {
      return <TouchableComponent {...this.props}>{this.props.children}</TouchableComponent>;
    }
  }
}

const styles = StyleSheet.create({
  groupContainer: {
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  button: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 16,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 32,
  },
  text: {
    fontSize: 16,
    color: BLACK_87PC_TRANSPARENT,
    textAlignVertical: 'center',
  },
  rowSeparator: {
    backgroundColor: '#dddddd',
    height: 1,
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'black',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sheet: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 16,
    color: BLACK_54PC_TRANSPARENT,
    textAlignVertical: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: BLACK_54PC_TRANSPARENT,
    textAlignVertical: 'center',
  },
});
