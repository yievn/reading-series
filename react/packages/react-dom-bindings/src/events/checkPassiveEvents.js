/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {canUseDOM} from 'shared/ExecutionEnvironment';

export let passiveBrowserEventsSupported: boolean = false;

// Check if browser support events with passive listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
// 检查浏览器是否支持被动监听器，不支持浏览器会报错
if (canUseDOM) {
  try {
    const options: {
      passive?: void,
    } = {};
    /**
     * getter 设定了一个标识 passiveBrowserEventsSupported，
     * 被调用后就会把其设为 true。
     * 那意味着如果浏览器检查 options 对象上的 passive 值时，
     * passiveBrowserEventsSupported 将会被设置为 true；否则它将保持 false。
     * 然后我们调用 addEventListener() 去设置一个指定这些选项的空事件处理器，
     * 这样如果浏览器将第三个参数认定为对象的话，这些选项值就会被检查。
     */
    Object.defineProperty(options, 'passive', {
      get: function () {
        passiveBrowserEventsSupported = true;
      },
    });
    window.addEventListener('test', options, options);
    window.removeEventListener('test', options, options);
  } catch (e) {
    passiveBrowserEventsSupported = false;
  }
}
