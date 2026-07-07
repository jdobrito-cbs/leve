jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('@react-native-community/datetimepicker', () => {
  const mockReact = require('react');
  const MockPicker = (props) => mockReact.createElement('DateTimePicker', props);
  return { __esModule: true, default: MockPicker };
});
