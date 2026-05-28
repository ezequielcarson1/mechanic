import { renderHook, act } from '@testing-library/react-native';
import { useDailyCall } from '../useDailyCall';

const mockHandlers: Record<string, (e?: any) => void> = {};
const mockCallObject = {
  on: jest.fn((evt: string, cb: (e?: any) => void) => { mockHandlers[evt] = cb; return mockCallObject; }),
  off: jest.fn(() => mockCallObject),
  join: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  setLocalAudio: jest.fn(),
  setLocalVideo: jest.fn(),
  cycleCamera: jest.fn(),
  localAudio: jest.fn(() => true),
  localVideo: jest.fn(() => true),
  participants: jest.fn(() => ({})),
};

jest.mock('@daily-co/react-native-daily-js', () => ({
  __esModule: true,
  default: { createCallObject: () => mockCallObject },
}));

describe('useDailyCall', () => {
  beforeEach(() => { jest.clearAllMocks(); for (const k of Object.keys(mockHandlers)) delete mockHandlers[k]; });

  it('joins with the room url and token', async () => {
    const { result } = renderHook(() => useDailyCall());
    await act(async () => { await result.current.join('https://x.daily.co/room', 'tok-1'); });
    expect(mockCallObject.join).toHaveBeenCalledWith({ url: 'https://x.daily.co/room', token: 'tok-1' });
  });

  it('sets callState to joined on joined-meeting event', async () => {
    const { result } = renderHook(() => useDailyCall());
    await act(async () => { await result.current.join('https://x.daily.co/room', 'tok-1'); });
    act(() => { mockHandlers['joined-meeting']?.(); });
    expect(result.current.callState).toBe('joined');
  });

  it('toggleAudio flips the muted flag via setLocalAudio', async () => {
    const { result } = renderHook(() => useDailyCall());
    await act(async () => { await result.current.join('https://x.daily.co/room', 'tok-1'); });
    act(() => { result.current.toggleAudio(); });
    expect(mockCallObject.setLocalAudio).toHaveBeenCalledWith(false);
  });
});
