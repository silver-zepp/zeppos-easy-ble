import { getDeviceInfo } from "@zos/device";
export const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = getDeviceInfo();

export const SCREEN_CENTER_X = DEVICE_WIDTH / 2;
export const SCREEN_CENTER_Y = DEVICE_HEIGHT / 2;

export const BTN_WIDTH = 100;
export const BTN_HEIGHT = 40;

export const TEXT_SIZE = 24;

export const LINE_COLOR = 0x333333;

export const COLOR_WHITE = 0xffffff; 
export const COLOR_BLACK = 0x000000;
export const COLOR_ORANGE = 0xFFA500;
export const COLOR_RED = 0x8B0000;
export const COLOR_GREEN = 0x3cb371;
export const COLOR_BLUE = 0x0884d0;
export const COLOR_YELLOW = 0xFFFF00;
export const COLOR_INDIGO = 0x4B0082;
export const COLOR_VIOLET = 0xEE82EE;
export const COLOR_GRAY = 0x808080;